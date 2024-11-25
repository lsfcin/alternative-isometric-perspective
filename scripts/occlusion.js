// export all functions to main.js
export function registerOcclusionConfig() {
	/*
	const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
	const enableOcclusionTokenSilhouette = game.settings.get(MODULE_ID, "enableOcclusionTokenSilhouette");
	if (!isometricWorldEnabled || !enableOcclusionTokenSilhouette) return;
	*/
	 
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
function processAllTokens() {
	// Em vez de processar todos os tokens, vamos verificar cada token individualmente
	canvas.tokens.placeables.forEach(token => {
		 // Verificar se o token realmente precisa do efeito
		 const hasCollision = checkTokenCollisions(token);
		 if (!hasCollision) {
			  removeOcclusionEffects(token);
		 }
	});
}

function handleTokenDocument(tokenDoc) {
	processTokenOcclusion(tokenDoc.object);
}

/*
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
*/

function processTokenOcclusion(token) {
	if (!token?.mesh) return;

	const tiles = canvas.tiles.placeables.filter(tile => 
		 tile.document.occlusion?.mode !== CONST.TILE_OCCLUSION_MODES.NONE
	);
	
	let hasOcclusion = false;
	
	for (const tile of tiles) {
		 const { occluded, intersectionArea } = checkTokenOcclusionPixels(token, tile);
		 if (occluded) {
			  applyOcclusionEffects(token, intersectionArea);
			  hasOcclusion = true;
			  break;
		 }
	}
	
	if (!hasOcclusion) {
		 removeOcclusionEffects(token);
	}
}


function checkTokenCollisions(token) {
	if (!token?.mesh) return false;

	// Verifica todos os tiles, não apenas os que têm oclusão
	const tiles = canvas.tiles.placeables;
	
	// Verifica cada tile para colisão
	for (const tile of tiles) {
		 if (checkPixelCollision(token, tile)) {
			  applyOcclusionEffects(token, tile);
			  return true;
		 }
	}
	
	return false;
}

function checkPixelCollision(token, tile) {
	const tokenSprite = token.mesh;
	const tileSprite = tile.mesh;
	
	// Primeiro faz uma verificação rápida de bounds
	const tokenBounds = tokenSprite.getBounds();
	const tileBounds = tileSprite.getBounds();
	
	if (!(tokenBounds.right < tileBounds.left ||
			tokenBounds.left > tileBounds.right ||
			tokenBounds.bottom < tileBounds.top ||
			tokenBounds.top > tileBounds.bottom)) {
			  
		 // Se houver sobreposição de bounds, verifica pixel a pixel
		 return checkPixelOverlap(tokenSprite, tileSprite);
	}
	
	return false;
}

function checkPixelOverlap(tokenSprite, tileSprite) {
	// Criar canvas temporário
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	// Obter dados dos sprites
	const tokenTexture = tokenSprite.texture;
	const tileTexture = tileSprite.texture;
	
	// Configurar canvas para o tamanho necessário
	canvas.width = Math.max(tokenTexture.width, tileTexture.width);
	canvas.height = Math.max(tokenTexture.height, tileTexture.height);
	
	// Desenhar sprites no canvas
	ctx.drawImage(tokenTexture.baseTexture.resource.source, 
					 tokenSprite.position.x, 
					 tokenSprite.position.y);
					 
	ctx.drawImage(tileTexture.baseTexture.resource.source,
					 tileSprite.position.x,
					 tileSprite.position.y);
	
	// Obter dados dos pixels
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = imageData.data;
	
	// Verificar se há pixels não transparentes sobrepostos
	for (let i = 3; i < pixels.length; i += 4) {
		 if (pixels[i] > 0) { // Se encontrar um pixel não transparente
			  return true;
		 }
	}
	
	return false;
}

function applyOcclusionEffects(token, tile) {
	if (PIXI_FILTERS.has(token.id)) return;

	// Criar container para o efeito
	const occlusionContainer = new PIXI.Container();
	
	// Criar sprite com a mesma textura do token
	const occludedSprite = new PIXI.Sprite(token.mesh.texture.clone());
	
	// Criar máscara baseada na interseção
	const mask = new PIXI.Sprite(tile.mesh.texture);
	mask.position.x = tile.mesh.position.x - token.mesh.position.x;
	mask.position.y = tile.mesh.position.y - token.mesh.position.y;
	
	// Aplicar máscara e filtros
	occludedSprite.mask = mask;
	occludedSprite.filters = [
		 new PIXI.ColorMatrixFilter({
			  matrix: [
					0.000, 0.000, 0.000, 0.500, 0.000,
					0.000, 0.000, 0.000, 0.500, 0.000,
					0.000, 0.000, 0.000, 0.500, 0.000,
					0.000, 0.000, 0.000, 1.000, 0.000
			  ]
		 })
	];
	
	// Adicionar ao container
	occlusionContainer.addChild(occludedSprite);
	occlusionContainer.addChild(mask);
	
	// Armazenar referências
	PIXI_FILTERS.set(token.id, {
		 container: occlusionContainer,
		 sprite: occludedSprite,
		 mask: mask
	});
	
	// Adicionar ao token
	token.mesh.addChild(occlusionContainer);
}

function removeOcclusionEffects(token) {
	const occlusionData = PIXI_FILTERS.get(token.id);
	if (occlusionData) {
		 const { container, sprite, mask } = occlusionData;
		 
		 // Limpar recursos
		 sprite.mask = null;
		 sprite.filters = null;
		 container.removeChild(sprite);
		 container.removeChild(mask);
		 token.mesh.removeChild(container);
		 
		 // Limpar texturas
		 sprite.texture.destroy(true);
		 mask.texture.destroy(true);
		 
		 PIXI_FILTERS.delete(token.id);
	}
}


/*
function checkTokenOcclusionPixels(token, tile) {
	const tokenSprite = token.mesh;
	const tileSprite = tile.mesh;
	
	// Obter as texturas
	const tokenTexture = tokenSprite.texture;
	const tileTexture = tileSprite.texture;
	
	// Criar canvas temporário para análise de pixels
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	// Converter as coordenadas do mundo para coordenadas locais
	const tokenBounds = tokenSprite.getBounds();
	const tileBounds = tileSprite.getBounds();
	
	// Área de interseção
	const intersection = {
		 left: Math.max(tokenBounds.left, tileBounds.left),
		 right: Math.min(tokenBounds.right, tileBounds.right),
		 top: Math.max(tokenBounds.top, tileBounds.top),
		 bottom: Math.min(tokenBounds.bottom, tileBounds.bottom)
	};
	
	// Se não há interseção, retorna false
	if (intersection.left >= intersection.right || intersection.top >= intersection.bottom) {
		 return { occluded: false, intersectionArea: null };
	}
	
	// Calcular área de interseção em coordenadas relativas ao token
	const relativeIntersection = {
		 left: (intersection.left - tokenBounds.left) / tokenBounds.width,
		 right: (intersection.right - tokenBounds.left) / tokenBounds.width,
		 top: (intersection.top - tokenBounds.top) / tokenBounds.height,
		 bottom: (intersection.bottom - tokenBounds.top) / tokenBounds.height
	};
	
	return {
		 occluded: true,
		 intersectionArea: relativeIntersection
	};
}

function applyOcclusionEffects(token, intersectionArea) {
	if (!intersectionArea) return;
	
	// Criar um sprite mask para a área de interseção
	const maskGraphics = new PIXI.Graphics();
	maskGraphics.beginFill(0xffffff);
	maskGraphics.drawRect(
		 intersectionArea.left * token.mesh.width,
		 intersectionArea.top * token.mesh.height,
		 (intersectionArea.right - intersectionArea.left) * token.mesh.width,
		 (intersectionArea.bottom - intersectionArea.top) * token.mesh.height
	);
	maskGraphics.endFill();
	
	// Criar o filtro apenas para a área mascarada
	const colorMatrixFilter = new PIXI.ColorMatrixFilter();
	colorMatrixFilter.alpha = 1;
	colorMatrixFilter.matrix = [
		 0.000, 0.000, 0.000, 0.500, 0.000,
		 0.000, 0.000, 0.000, 0.500, 0.000,
		 0.000, 0.000, 0.000, 0.500, 0.000,
		 0.000, 0.000, 0.000, 1.000, 0.000
	];
	
	// Criar container para a área ocluída
	const occlusionContainer = new PIXI.Container();
	const occludedSprite = new PIXI.Sprite(token.mesh.texture);
	occludedSprite.mask = maskGraphics;
	occludedSprite.filters = [colorMatrixFilter];
	
	occlusionContainer.addChild(occludedSprite);
	occlusionContainer.addChild(maskGraphics);
	
	// Armazenar referências para limpeza posterior
	PIXI_FILTERS.set(token.id, {
		 container: occlusionContainer,
		 mask: maskGraphics,
		 sprite: occludedSprite
	});
	
	// Adicionar ao token
	token.mesh.addChild(occlusionContainer);
}

function removeOcclusionEffects(token) {
	const occlusionData = PIXI_FILTERS.get(token.id);
	if (occlusionData) {
		 const { container, mask, sprite } = occlusionData;
		 
		 // Remover elementos
		 sprite.mask = null;
		 container.removeChild(mask);
		 container.removeChild(sprite);
		 token.mesh.removeChild(container);
		 
		 PIXI_FILTERS.delete(token.id);
	}
}
/*
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
*/







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