// export all functions to main.js
export function registerOcclusionConfig() {
	// Hooks diretos
	Hooks.on('createToken',  handleTokenDocument);
	Hooks.on('updateToken',  handleTokenDocument);
	Hooks.on('refreshToken', processTokenOcclusion);
	Hooks.on('deleteToken', function(tokenDoc) {
		PIXI_FILTERS.delete(tokenDoc.id);
	});

	Hooks.on('updateTile',   processAllTokens);
	Hooks.on('refreshTile',  processAllTokens);

	Hooks.on('canvasReady',  processAllTokens);
	Hooks.on('canvasPan',    processAllTokens);

}

// Mapa global para armazenar os filtros PIXI
const PIXI_FILTERS = new Map();

// Funções principais
function processTokenOcclusion(token) {
	if (!token?.mesh) return;

	// Check if token is occluded by any tiles
	const isOccluded = checkTokenOcclusion(token);
	if (isOccluded) {
		applyOcclusionEffects(token);
	} else {
		removeOcclusionEffects(token);
	}
}

function checkTokenOcclusion(token) {
	// Get all tiles that might occlude the token
	const tiles = canvas.tiles.placeables.filter(function(tile) {
		// Only check tiles with occlusion enabled
		return tile.document.occlusion?.mode !== CONST.TILE_OCCLUSION_MODES.NONE;
	});

	// Check if any tile occludes the token
	return tiles.some(function(tile) {
		// Get the real dimensions of the token and tile sprite after transformations
		const tokenBounds = token.mesh.getBounds();
		const tileBounds = tile.mesh.getBounds();

		// Check intersection using the transformed dimensions
		return !(tokenBounds.right < tileBounds.left ||
			tokenBounds.left > tileBounds.right ||
			tokenBounds.bottom < tileBounds.top ||
			tokenBounds.top > tileBounds.bottom);
	});
}

function applyOcclusionEffects(token) {
	if (PIXI_FILTERS.has(token.id)) return;

	// Create new outline filter
	const outlineFilter = new PIXI.filters.isoOutlineFilter();
	outlineFilter.thickness = 0.01;
	outlineFilter.color = 0xff0000;

	// Create new color matrix filter
	const colorMatrixFilter = new PIXI.ColorMatrixFilter();
	colorMatrixFilter.alpha = 1;
	colorMatrixFilter.matrix = [
		0.000, 0.000, 0.000, 0.500, 0.000,
		0.000, 0.000, 0.000, 0.500, 0.000,
		0.000, 0.000, 0.000, 0.500, 0.000,
		0.000, 0.000, 0.000, 1.000, 0.000
	];

	// Create new alpha filter
	const alphaFilter = new PIXI.AlphaFilter();
	alphaFilter.alpha = 0.5;

	// Store the filters
	PIXI_FILTERS.set(token.id, [alphaFilter, outlineFilter, colorMatrixFilter]);
	
	// Apply filters to the token
	const filters = token.mesh.filters || [];
	filters.push(colorMatrixFilter, outlineFilter, alphaFilter);
	token.mesh.filters = filters;
}

function removeOcclusionEffects(token) {
	const filters = PIXI_FILTERS.get(token.id) || [];
	if (filters.length) {
		// Remove the filters
		token.mesh.filters = (token.mesh.filters || []).filter(function(f) {
			return !filters.includes(f);
		});
		PIXI_FILTERS.delete(token.id);
	}
}

function processAllTokens() {
	canvas.tokens.placeables.forEach(function(token) {
		processTokenOcclusion(token);
	});
}

function handleTokenDocument(tokenDoc) {
	processTokenOcclusion(tokenDoc.object);
}







// Definição do isoOutlineFilter
if (typeof PIXI !== 'undefined' && PIXI.filters) {
	const vertexShader =`
		attribute vec2 aVertexPosition;
		attribute vec2 aTextureCoord;

		uniform mat3 projectionMatrix;
		varying vec2 vTextureCoord;

		void main(void) {
			gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
			vTextureCoord = aTextureCoord;
		}
	`;

	const fragmentShader = `
		varying vec2 vTextureCoord;

		uniform sampler2D uSampler;
		uniform float alpha;
		uniform vec2 outlineThickness;
		uniform vec4 outlineColor;
		uniform vec4 filterArea;
		uniform vec4 filterClamp;

		void main(void) {
			vec4 ownColor = texture2D(uSampler, vTextureCoord);
			vec4 curColor;
			float maxAlpha = 0.0;
			vec2 displaced;

			for (float angle = 0.0; angle < 6.28318530718; angle += 0.78539816339) {
				displaced.x = vTextureCoord.x + outlineThickness.x * cos(angle);
				displaced.y = vTextureCoord.y + outlineThickness.y * sin(angle);
				curColor = texture2D(uSampler, displaced);
				maxAlpha = max(maxAlpha, curColor.a);
			}
			float resultAlpha = max(maxAlpha, ownColor.a);
			gl_FragColor = vec4((ownColor.rgb * ownColor.a + outlineColor.rgb * (1.0 - ownColor.a)) * resultAlpha, resultAlpha);
		 }
	`;

	// Defina a classe isoOutlineFilter
	class IsoOutlineFilter extends PIXI.Filter {
		constructor(thickness = 1, color = 0x000000, alpha = 1) {
			super(vertexShader, fragmentShader);

			// Inicialize os uniforms
			this.uniforms.outlineColor = new Float32Array(4); // Para armazenar RGBA
			this.uniforms.outlineThickness = new Float32Array(2); // Para armazenar X e Y
			this.uniforms.filterArea = new Float32Array(2); // Para área de filtro
			this.uniforms.alpha = alpha;

			// Configure as propriedades iniciais
			this.color = color;
			this.thickness = thickness;
		}

		get alpha() {
			return this.uniforms.alpha;
		}
		set alpha(value) {
			this.uniforms.alpha = value;
		}

		get color() {
			return PIXI.utils.rgb2hex(this.uniforms.outlineColor);
		}
		set color(value) {
			PIXI.utils.hex2rgb(value, this.uniforms.outlineColor);
		}

		get thickness() {
			return this.uniforms.outlineThickness[0];
		}
		set thickness(value) {
			// Certifique-se de que filterArea tenha valores válidos
			const filterAreaX = this.uniforms.filterArea[0] || 1; // Evite divisão por 0
			const filterAreaY = this.uniforms.filterArea[1] || 1; // Evite divisão por 0
			
			this.uniforms.outlineThickness[0] = value / filterAreaX;
			this.uniforms.outlineThickness[1] = value / filterAreaY;
		}
	}

	// Adicione o isoOutlineFilter ao namespace PIXI.filters
	PIXI.filters.isoOutlineFilter = IsoOutlineFilter;
} else {
	console.error('PIXI ou PIXI.filters não estão disponíveis.');
}