// Enhanced Occlusion Layer Module for Foundry VTT

export function registerOcclusionConfig() {
	// Global Hook Registration
	function registerGlobalHooks() {
		const updateTriggers = [ // Update triggers for occlusion layer
			'canvasReady', 
			'canvasPan',
			'canvasTokensRefresh', 
			'updateToken', 
			'controlToken', 
			'refreshToken',
			'preUpdateScene',  // Added to ensure update on scene modifications
			'updateScene'      // Added to ensure update on scene modifications
		];

		updateTriggers.forEach(hookName => {
			Hooks.on(hookName, () => {
				updateOcclusionLayer();
				//updateTokenEffects();
				//debouncedUpdate();
			});
		});
	}

	// Initialize on canvas setup
	// Hooks.on('refreshToken', () => { debouncedUpdate(); });
	
	// Initial layer setup
	Hooks.once('ready', () => {
		if (canvas.ready)
			initializeOcclusionLayer();
	});

	// Initialize on canvas setup
	Hooks.on('canvasInit', () => {
		initializeOcclusionLayer();
	});

	// Reset on scene change
	Hooks.on('changeScene', () => {
		if (occlusionConfig.container) {
			canvas.stage.removeChild(occlusionConfig.container);
			occlusionConfig.container.destroy({ children: true });
			occlusionConfig.container = null;
			occlusionConfig.tokensLayer = null;
			occlusionConfig.initialized = false;
		}
	});

	// Initialize on ready
	// Hooks.once('ready', () => {
	// 	if (canvas.ready)
	// 			initializeFilters();
	// });

	// // Initialize on canvas setup
	// Hooks.on('canvasInit', () => {
	// 		initializeFilters();
	// });

	// // Reset on scene change
	// Hooks.on('changeScene', () => {
	// 		resetTokenEffects();
	// });

	// Start the module
	registerGlobalHooks();
}

// Otimização 1: Debounce do updateOcclusionLayer
//const debouncedUpdate = debounce(updateOcclusionLayer, 50);
//const throttledUpdate = throttle(updateOcclusionLayer, 50);





// Store filters globally
const filters = {
	colorMatrix: null,
	outlineFilter: null,
	initialized: false
};

// Initialize filters
function initializeFilters() {
	if (filters.initialized) return;

	// Create outline filter
	filters.outlineFilter = new PIXI.filters.isoOutlineFilter();
	filters.outlineFilter.thickness = 0.005;
	filters.outlineFilter.color = 0x00ff59;

	// Create color matrix filter
	filters.colorMatrix = new PIXI.ColorMatrixFilter();
	filters.colorMatrix.alpha = 1;
	filters.colorMatrix.matrix = [
			0.3, 0.0, 0.0, 0.0, 0.0,
			0.0, 0.3, 0.0, 0.0, 0.0,
			0.0, 0.0, 0.3, 0.0, 0.0,
			0.0, 0.0, 0.0, 1.0, 0.0
	];

	filters.initialized = true;
}

// Reset token effects
function resetTokenEffects() {
	if (!canvas.ready) return;
	
	canvas.tokens.placeables.forEach(token => {
		if (token.mesh) {
			token.mesh.filters = token.mesh.filters?.filter(f => 
				f !== filters.colorMatrix && f !== filters.outlineFilter) || [];
			token.mesh.mask = null;
		}
	});
}

// Update token effects
function updateTokenEffects() {
	if (!canvas.ready || !filters.initialized) return;

	// Get all tokens and tiles
	const tokens = canvas.tokens.placeables;
	const tiles = canvas.tiles.placeables;

	// Reset all tokens first
	resetTokenEffects();

	// Apply effects to tokens that intersect with tiles
	tokens.forEach(token => {
		const intersectingTiles = tiles.filter(tile => 
			checkTokenTileIntersection(token, tile)
		);

		if (intersectingTiles.length > 0) {
			applyTokenEffects(token, intersectingTiles);
		}
	});
}

// Apply effects to token
function applyTokenEffects(token, intersectingTiles) {
	if (!token.mesh) return;

	// Create mask for the token
	const mask = createOcclusionMask(token, intersectingTiles);
	if (mask) {
		token.mesh.mask = mask;
	}

	// Apply filters directly to token mesh
	token.mesh.filters = [...(token.mesh.filters || []).filter(f => f !== filters.colorMatrix && f !== filters.outlineFilter),
		filters.colorMatrix,
		filters.outlineFilter
	];
}










// Persistent occlusion layer configuration
const occlusionConfig = {
	container: null,
	tokensLayer: null,
	initialized: false
};

// Initialize or reset the occlusion layer
function initializeOcclusionLayer() {
	// Remove existing container if it exists
	if (occlusionConfig.container) {
		canvas.stage.removeChild(occlusionConfig.container);
		occlusionConfig.container.destroy({ children: true });
	}

	// Create the main occlusion container
	occlusionConfig.container = new PIXI.Container();
	occlusionConfig.container.name = "OcclusionContainer";
	occlusionConfig.container.eventMode = 'passive';

	// Create a layer for occlusion tokens
	occlusionConfig.tokensLayer = new PIXI.Container();
	occlusionConfig.tokensLayer.name = "OcclusionTokens";
	occlusionConfig.tokensLayer.sortableChildren = true;

	// Add the layer to the container
	occlusionConfig.container.addChild(occlusionConfig.tokensLayer);

	// Add to canvas stage
	canvas.stage.addChild(occlusionConfig.container);
	canvas.stage.sortChildren();

	occlusionConfig.initialized = true;
}



// Comprehensive update mechanism for occlusion layer
function updateOcclusionLayer() {
	// Ensure canvas is ready and layer is initialized
	if (!canvas.ready) return;

	// Reinitialize if not yet set up
	if (!occlusionConfig.initialized) {
		initializeOcclusionLayer();
	}

	// Clear existing occlusion tokens
	occlusionConfig.tokensLayer.removeChildren();

	// Get all tokens and tiles
	const tokens = canvas.tokens.placeables;
	const tiles = canvas.tiles.placeables;

	tokens.forEach(token => {
		// Find tiles that intersect with this token
		const intersectingTiles = tiles.filter(tile => 
			checkTokenTileIntersection(token, tile)
		);

		// If there are intersecting tiles, create an occlusion sprite
		if (intersectingTiles.length > 0) {
			const occlusionSprite = createOcclusionSprite(token, intersectingTiles);
			if (occlusionSprite) {
				occlusionConfig.tokensLayer.addChild(occlusionSprite);
			}
		}
	});
}







// Token-Tile Intersection Check
function checkTokenTileIntersection(token, tile) {
	// Basic intersection check using bounding boxes
	const tokenBounds = token.mesh.getBounds();
	const tileBounds = tile.mesh.getBounds();

	return (
		tokenBounds.x < tileBounds.x + tileBounds.width &&
		tokenBounds.x + tokenBounds.width > tileBounds.x &&
		tokenBounds.y < tileBounds.y + tileBounds.height &&
		tokenBounds.y + tokenBounds.height > tileBounds.y
	);
}







// Create Occlusion Sprite with Advanced Masking
function createOcclusionSprite(token, intersectingTiles) {
	if (!token.mesh || !token.mesh.texture) return null;

	// Create a sprite from the token's texture
	const sprite = new PIXI.Sprite(token.mesh.texture);
	sprite.position.set(token.mesh.position.x, token.mesh.position.y);
	sprite.anchor.set(token.mesh.anchor.x, token.mesh.anchor.y);
	sprite.angle = token.mesh.angle;
	sprite.scale.set(token.mesh.scale.x, token.mesh.scale.y);

	// Create a mask for the occlusion
	const mask = createOcclusionMask(token, intersectingTiles);
	
	if (mask) {
		sprite.mask = mask;
	}

	// sprite.filters = [colorMatrix, outlineFilter, alphaFilter];
	sprite.filters = [colorMatrix, outlineFilter]; //filter configs at eof

	//sprite.alpha = 0.75;
	sprite.eventMode = 'passive';

	return sprite;
}














// Advanced Occlusion Mask Creation
const alphaFragmentShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;       // Textura do token (não usada aqui)
uniform sampler2D uTileMask;      // Textura do tile
uniform vec4 dimensions;          // [x, y, width, height] da interseção
uniform vec4 tileDimensions;      // [x, y, width, height] do tile

void main(void) {
	// Posição local do fragmento na interseção
	vec2 localPos = gl_FragCoord.xy - dimensions.xy;
	
	// Coordenadas UV normalizadas para a textura do tile
	vec2 tileCoord = vec2(
		(localPos.x / dimensions.z) * (tileDimensions.z / dimensions.z),
		(localPos.y / dimensions.w) * (tileDimensions.w / dimensions.w)
	);

	// Ajuste para considerar a posição do tile no canvas
	tileCoord.x += (dimensions.x - tileDimensions.x) / tileDimensions.z;
	tileCoord.y += (dimensions.y - tileDimensions.y) / tileDimensions.w;

	// Amostra a textura do tile
	vec4 tileColor = texture2D(uTileMask, tileCoord);

	// Amostra a textura do token
	vec4 tokenColor = texture2D(uSampler, vTextureCoord);

	// Se o pixel do tile for opaco, cria uma máscara branca opaca
	if (tileColor.a > 0.1) {
		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Branco opaco
	} else {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparente
	}
}

`;

function createOcclusionMask(token, intersectingTiles) {
	const gpu = 0;
	const chunkSize = 8;
	// 1  = pixel perfect, but cpu intensive;
	// 2  = okish, still cpu intensive with a lot of tokens on scene, kinda pixelated, but work for simple tiles
	// 3  = still heavy on performance, but only with a lot of tokens, pixelated, works only on tiles with straight lines
	// 4+ = light on cpu in zoom out, heavy on cpu on zoom in, really pixelated
	// 8+ = light on cpu on almost all scenarios, works only with rectangle tiles

	if (gpu === 1) {
		return createOcclusionMask_gpu(token, intersectingTiles)
	} else {
		return createOcclusionMask_cpu(token, intersectingTiles, chunkSize)
	}
}

function createOcclusionMask_gpu(token, intersectingTiles) {
		const maskGraphics = new PIXI.Graphics();
		maskGraphics.beginFill(0xffffff);

		intersectingTiles.forEach(tile => {
			const tokenBounds = token.mesh.getBounds();
			const tileBounds = tile.mesh.getBounds();
	
			// Calculate intersection area
			const x = Math.max(tokenBounds.x, tileBounds.x);
			const y = Math.max(tokenBounds.y, tileBounds.y);
			const width = Math.min(tokenBounds.x + tokenBounds.width, tileBounds.x + tileBounds.width) - x;
			const height = Math.min(tokenBounds.y + tokenBounds.height, tileBounds.y + tileBounds.height) - y;

			if (width <= 0 || height <= 0) return;

			// Draw intersection area
			maskGraphics.drawRect(x, y, width, height);

			// Create and apply alpha filter
			const alphaFilter = new PIXI.Filter(undefined, alphaFragmentShader, {
				uTileMask: tile.texture,
				dimensions: new Float32Array([x, y, width, height]),
				tileDimensions: new Float32Array([
					tileBounds.x, tileBounds.y, tileBounds.width, tileBounds.height
				])
			});
			maskGraphics.filters = [...(maskGraphics.filters || []), alphaFilter];
		});

		maskGraphics.endFill();
		return maskGraphics;
}




function createOcclusionMask_cpu(token, intersectingTiles, chunkSize = 2) {
	const maskGraphics = new PIXI.Graphics();
	maskGraphics.beginFill(0xffffff);

	// Create a temporary canvas once
	const tempCanvas = document.createElement('canvas');
	const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
	
	const tokenBounds = token.mesh.getBounds();

	intersectingTiles.forEach(tile => {
		const tileBounds = tile.mesh.getBounds();
		
		// Calculate intersection area
		const x = Math.max(tokenBounds.x, tileBounds.x);
		const y = Math.max(tokenBounds.y, tileBounds.y);
		const width = Math.min(tokenBounds.x + tokenBounds.width, tileBounds.x + tileBounds.width) - x;
		const height = Math.min(tokenBounds.y + tokenBounds.height, tileBounds.y + tileBounds.height) - y;

		// Skip if no intersection
		if (width <= 0 || height <= 0) return;

		// Access tile texture
		const tileTexture = tile.texture?.baseTexture?.resource?.source;
		if (!tileTexture || tileTexture.width <= 0 || tileTexture.height <= 0) return;

		// Set canvas size to intersection size
		tempCanvas.width = Math.ceil(width);
		tempCanvas.height = Math.ceil(height);

		// Calculate source and destination rectangles
		const sourceX = (x - tileBounds.x) * (tileTexture.width / tileBounds.width);
		const sourceY = (y - tileBounds.y) * (tileTexture.height / tileBounds.height);
		const sourceWidth = width * (tileTexture.width / tileBounds.width);
		const sourceHeight = height * (tileTexture.height / tileBounds.height);

		// Clear the canvas and Draw the relevant portion of the tile
		tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		tempCtx.drawImage(tileTexture,
				sourceX, sourceY, sourceWidth, sourceHeight,
				0, 0, tempCanvas.width, tempCanvas.height
		);

		// Get image data for the intersection area
		const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
		const data = imageData.data;

		const width32 = tempCanvas.width;
		const height32 = tempCanvas.height;
		
		const dataU32 = new Uint32Array(imageData.data.buffer);

		for (let cy = 0; cy < height32; cy += chunkSize) {
			for (let cx = 0; cx < width32; cx += chunkSize) {
				let hasOpaquePixel = false;

				// Check the chunk for any non-transparent pixels
				chunkCheck: for (let by = 0; by < chunkSize; by++) {
					const y = cy + by;
					if (y >= height32) break;

					for (let bx = 0; bx < chunkSize; bx++) {
						const x = cx + bx;
						if (x >= width32) break;

						const pixelIndex = y * width32 + x;
						const alphaValue = dataU32[pixelIndex] >>> 24;

						if (alphaValue > 0) {
							hasOpaquePixel = true;
							break chunkCheck;
						}
					}
				}

				// If chunk has any non-transparent pixels, draw it
				if (hasOpaquePixel) {
					maskGraphics.drawRect(
						x + cx, 
						y + cy, 
						Math.min(chunkSize, width32 - cx), 
						Math.min(chunkSize, height32 - cy)
					);
				}
			}
		}
	});

	// Clean up
	tempCanvas.remove();
	return maskGraphics;
}

// Pode chamar o código de duas maneiras agora, 
// Usando o tamanho de chunk padrão (1):
//     createOcclusionMask(token, intersectingTiles)
// Ou especificando um tamanho de chunk diferente:
//     createOcclusionMask(token, intersectingTiles, 2)






















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
		constructor(thickness = 0.5, color = 0x000000, alpha = 0.5) {
			super(vertexShader, fragmentShader);

			// Inicialize os uniforms
			this.uniforms.outlineColor = new Float32Array(4);     // Para armazenar RGBA
			this.uniforms.outlineThickness = new Float32Array(2); // Para armazenar X e Y
			this.uniforms.filterArea = new Float32Array(2);       // Para área de filtro
			this.uniforms.alpha = alpha;

			// Configure as propriedades iniciais
			this.color = color;
			this.thickness = thickness;
		}

		get alpha() { return this.uniforms.alpha; }
		set alpha(value) { this.uniforms.alpha = value; }

		get color() { return PIXI.utils.rgb2hex(this.uniforms.outlineColor); }
		set color(value) { PIXI.utils.hex2rgb(value, this.uniforms.outlineColor); }

		get thickness() { return this.uniforms.outlineThickness[0]; }
		set thickness(value) {
			// Certifique-se de que filterArea tenha valores válidos
			const filterAreaX = this.uniforms.filterArea[0] || 1; // Evite divisão por 0
			const filterAreaY = this.uniforms.filterArea[1] || 1; // Evite divisão por 0
			
			this.uniforms.outlineThickness[0] = value / filterAreaX;
			this.uniforms.outlineThickness[1] = value / filterAreaY;
		}
	}

	// Add the isooutlinefilter to the PIXI.filters namepace
	PIXI.filters.isoOutlineFilter = IsoOutlineFilter;
} else {
	console.error('PIXI ou PIXI.filters não estão disponíveis.');
}

// Create new outline filter
const outlineFilter = new PIXI.filters.isoOutlineFilter();
outlineFilter.thickness = 0.005;
outlineFilter.color = 0x00ff59;
		
// Create a greyscale/dimming filter
const colorMatrix = new PIXI.ColorMatrixFilter();
colorMatrix.alpha = 1;
colorMatrix.matrix = [
	0.3,  0.0,  0.0,  0.0,  0.0,
	0.0,  0.3,  0.0,  0.0,  0.0,
	0.0,  0.0,  0.3,  0.0,  0.0,
	0.0,  0.0,  0.0,  1.0,  0.0
];

const alphaFilter = new PIXI.AlphaFilter();
alphaFilter.alpha = 0.5;