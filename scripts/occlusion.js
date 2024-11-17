export class TokenEffectModule {
	static ID = 'token-occlusion-effect';
 	static PIXI_FILTERS = new Map();
 
	static initialize() {
		// Register the occlusion filters for tokens
		Hooks.on('createToken', this._handleTokenCreate.bind(this));
		Hooks.on('updateToken', this._handleTokenUpdate.bind(this));
		Hooks.on('refreshToken', this._handleTokenRefresh.bind(this));
		Hooks.on('updateTile', this._handleTileUpdate.bind(this));
		Hooks.on('refreshTile', this._handleTileRefresh.bind(this));
		Hooks.on('canvasReady', this._handleCanvasReady.bind(this));
		Hooks.on('canvasPan', () => this._checkAllTokens());
	}

	// Process all existing tokens when canvas loads
	static _handleCanvasReady() {
	  	canvas.tokens.placeables.forEach(token => this._processTokenOcclusion(token));
	}
	static _handleTokenCreate(tokenDocument) {
		const token = tokenDocument.object;
		this._processTokenOcclusion(token);
	}
	static _handleTokenUpdate(tokenDocument) {
		const token = tokenDocument.object;
		this._processTokenOcclusion(token);
	}
	static _handleTokenRefresh(token) {
		this._processTokenOcclusion(token);
	}
	static _handleTileUpdate(tileDocument) {
		// When a tile updates, check all tokens for potential occlusion changes
		canvas.tokens.placeables.forEach(token => this._processTokenOcclusion(token));
	}
	static _handleTileRefresh(tile) {
		this._checkAllTokens();
	}
	static _checkAllTokens() {
		canvas.tokens.placeables.forEach(token => this._processTokenOcclusion(token));
	}


	static _processTokenOcclusion(token) {
		if (!token?.mesh) return;
	
		// Check if token is occluded by any tiles
		const isOccluded = this._checkTokenOcclusion(token);
		if (isOccluded) {
			this._applyOcclusionEffects(token);
		} else {
			this._removeOcclusionEffects(token);
		}
	}
 
	static _checkTokenOcclusion(token) {
		// Get all tiles that might occlude the token
		const tiles = canvas.tiles.placeables.filter(tile => {
			// Only check tiles with occlusion enabled
			return tile.document.occlusion?.mode !== CONST.TILE_OCCLUSION_MODES.NONE;
		});
	
		// Check if any tile occludes the token
		return tiles.some(tile => {
			// Get the real dimensions of the token and tile sprite after transformations
			const tokenSpriteBounds = token.mesh.getBounds();
			const tileSpriteBounds = tile.mesh.getBounds();

			// Check intersection using the transformed dimensions
			return !(tokenSpriteBounds.right < tileSpriteBounds.left ||
				tokenSpriteBounds.left > tileSpriteBounds.right ||
				tokenSpriteBounds.bottom < tileSpriteBounds.top ||
				tokenSpriteBounds.top > tileSpriteBounds.bottom);
		});
	}
 
	static _applyOcclusionEffects(token) {
		if (!this.PIXI_FILTERS.has(token.id)) {
			// Create new outline filter
			const outlineFilter = new PIXI.filters.isoOutlineFilter();
			outlineFilter.thickness = 0.01; // Adjust outline thickness as needed
			outlineFilter.color = 0xff0000; // Adjust outline color as needed
	
			// Create new color matrix filter
			const colorMatrixFilter = new PIXI.ColorMatrixFilter();
			colorMatrixFilter.alpha = 0.5; // Adjust alpha as needed
			colorMatrixFilter.matrix = [
				0.000, 0.000, 0.000, 0.500, 0.000,
				0.000, 0.000, 0.000, 0.500, 0.000,
				0.000, 0.000, 0.000, 0.500, 0.000,
				0.000, 0.000, 0.000, 1.000, 0.000
			]; // Adjust color matrix as needed
	
			// Store the filters
			this.PIXI_FILTERS.set(token.id, [outlineFilter, colorMatrixFilter]);
	
			// Apply filters to the token
			const filters = token.mesh.filters || [];
			filters.push(outlineFilter);
			filters.push(colorMatrixFilter);
			token.mesh.filters = filters;
		}
	}
 
	static _removeOcclusionEffects(token) {
		const [outlineFilter, colorMatrixFilter] = this.PIXI_FILTERS.get(token.id) || [];
		if (outlineFilter && colorMatrixFilter) {
			// Remove the filters
			token.mesh.filters = (token.mesh.filters || []).filter(f => f !== outlineFilter && f !== colorMatrixFilter);
			this.PIXI_FILTERS.delete(token.id);
		}
	}
}


// Clean up filters when tokens are deleted
Hooks.on('deleteToken', (tokenDocument) => {
	TokenEffectModule.PIXI_FILTERS.delete(tokenDocument.id);
});




// Verifique se PIXI e PIXI.filters estão disponíveis
if (typeof PIXI !== 'undefined' && PIXI.filters) {
	// Defina o shader de vértice
	const vertexShader = `
		attribute vec2 aVertexPosition;
		attribute vec2 aTextureCoord;
	
		uniform mat3 projectionMatrix;
		varying vec2 vTextureCoord;
	
		void main(void) {
			gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
			vTextureCoord = aTextureCoord;
		}
	`;
 
	// Defina o shader de fragmento
	const fragmentShader = `
		varying vec2 vTextureCoord;
	
		uniform sampler2D uSampler;
		uniform vec4 filterArea;
		uniform vec2 outlineThickness;
		uniform vec4 outlineColor;
		uniform float alpha;
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
	class isoOutlineFilter extends PIXI.Filter {
		constructor(thickness = 1, color = 0x000000, alpha = 1) {
			super(vertexShader, fragmentShader);
			
			// Inicialize os uniforms
			this.uniforms.outlineColor = new Float32Array(4); // Para armazenar RGBA
			this.uniforms.outlineThickness = new Float32Array(2); // Para armazenar X e Y
			this.uniforms.filterArea = new Float32Array(2); // Para área de filtro
			this.uniforms.alpha = alpha;

			// Configure as propriedades iniciais
			this.color = color; // Define a cor inicial
			this.thickness = thickness; // Define a espessura inicial
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
			const filterAreaY = this.uniforms.filterArea[1] || 1;
			
			this.uniforms.outlineThickness[0] = value / filterAreaX;
			this.uniforms.outlineThickness[1] = value / filterAreaY;
		}
	}
 
	// Adicione o isoOutlineFilter ao namespace PIXI.filters
	PIXI.filters.isoOutlineFilter = isoOutlineFilter;
} else {
	console.error('PIXI ou PIXI.filters não estão disponíveis.');
}