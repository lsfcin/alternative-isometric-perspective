import { MODULE_ID } from './main.js';

export function registerDynamicTileConfig() {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const enableOcclusionDynamicTile = game.settings.get(MODULE_ID, "enableOcclusionDynamicTile");
  //const isometricEnabled = game.settings.get(MODULE_ID, "isometricEnabled");
  if (!isometricWorldEnabled || !enableOcclusionDynamicTile) return;
  //if (!isometricWorldEnabled || !enableOcclusionDynamicTile || !isometricEnabled) return;

  // ---------------------- CANVAS ----------------------
  Hooks.on('canvasInit', () => {
    // Remove any existing container if it exists
    if (alwaysVisibleContainer) {
      canvas.stage.removeChild(alwaysVisibleContainer);
      alwaysVisibleContainer.destroy({ children: true });
    }
    
    // Cria o container principal
    alwaysVisibleContainer = new PIXI.Container();
    alwaysVisibleContainer.name = "AlwaysVisibleContainer";
    alwaysVisibleContainer.eventMode = 'passive';
    
    // Cria subcamadas separadas para tiles e tokens
    tilesLayer = new PIXI.Container();
    tokensLayer = new PIXI.Container();
    
    tilesLayer.name = "AlwaysVisibleTiles";
    tokensLayer.name = "AlwaysVisibleTokens";
    
    // Adiciona as camadas na ordem correta
    alwaysVisibleContainer.addChild(tilesLayer);
    alwaysVisibleContainer.addChild(tokensLayer);
    
    canvas.stage.addChild(alwaysVisibleContainer);
    canvas.stage.sortChildren();
  });
  // Add a hook to reset the container when scene changes
  Hooks.on('changeScene', () => {
    if (alwaysVisibleContainer) {
      // Remove the container from the stage
      canvas.stage.removeChild(alwaysVisibleContainer);
      
      // Destroy the container and its children
      alwaysVisibleContainer.destroy({ children: true });
      
      // Reset references
      alwaysVisibleContainer = null;
      tilesLayer = null;
      tokensLayer = null;
    }
  });
  Hooks.on('canvasReady', () => {
    updateAlwaysVisibleElements();
  });
  Hooks.on('canvasTokensRefresh', () => {
    updateAlwaysVisibleElements();
  });
  Hooks.on('updateUser', (user, changes) => {
    if (user.id === game.user.id && 'character' in changes) {
      updateAlwaysVisibleElements();
    }
  });



  // ---------------------- TILE ----------------------
  Hooks.on('createTile', (tile, data, options, userId) => {
    tile.setFlag(MODULE_ID, 'linkedWallId', null);
  });
  Hooks.on('updateTile', (tileDocument, change, options, userId) => {
    if ('flags' in change && MODULE_ID in change.flags) {
      updateAlwaysVisibleElements();
    }
  });
  Hooks.on('refreshTile', (tile) => {
    updateAlwaysVisibleElements();
  });
  Hooks.on('deleteTile', (tile, options, userId) => {
    updateAlwaysVisibleElements();
  });



  // ---------------------- TOKEN ----------------------
  Hooks.on('createToken', (token, options, userId) => {
    // Adiciona um pequeno atraso para garantir que o token esteja completamente inicializado
    setTimeout(() => {
      updateAlwaysVisibleElements();
    }, 100);
  });
  Hooks.on('controlToken', (token, controlled) => {
    if (controlled) {
      lastControlledToken = token; // Store the last controlled token
    }
    updateAlwaysVisibleElements();
  });
  Hooks.on('updateToken', (tokenDocument, change, options, userId) => {
    // Se o token atualizado for o último controlado, atualize a referência
    if (lastControlledToken && tokenDocument.id === lastControlledToken.id) {
      lastControlledToken = canvas.tokens.get(tokenDocument.id);
    }
    updateAlwaysVisibleElements();
  });
  Hooks.on('deleteToken', (token, options, userId) => {
    if (lastControlledToken && token.id === lastControlledToken.id) {
      lastControlledToken = null;
    }
    updateAlwaysVisibleElements();
  });
  Hooks.on("refreshToken", (token) => {
    updateAlwaysVisibleElements();
  });



  // ---------------------- OTHERS ----------------------
  Hooks.on('sightRefresh', () => {
    if (canvas.ready && alwaysVisibleContainer) {
      updateAlwaysVisibleElements();
    }
  });

  Hooks.on('updateWall', (wallDocument, change, options, userId) => {
    // Verifica se a mudança é relacionada ao estado da porta
    if ('ds' in change) {
      // Procura por tiles que têm esta wall vinculada
      const linkedTiles = canvas.tiles.placeables.filter(tile => 
        tile.document.getFlag(MODULE_ID, 'linkedWallId') === wallDocument.id
      );
      
      // Se encontrou algum tile vinculado, atualiza os elementos visíveis
      if (linkedTiles.length > 0) {
        updateAlwaysVisibleElements();
      }
    }
  });

  // Additional buttons for the tile layer
  Hooks.on("getSceneControlButtons", (controls) => {
    const newButtons = controls.find(b => b.name === "tiles"); // "token, measure, tiles, drawings, walls, lightning"
  
    newButtons.tools.push({
      name: 'dynamic-tile-increase',
      title: 'Increase Dynamic Tile Opacity',
      icon: 'fa-solid fa-layer-group',
      active: true,
      onClick: () => increaseTilesOpacity(),
      button: true
    },{
      name: 'dynamic-tile-decrease',
      title: 'Decrease Dynamic Tile Opacity',
      icon: 'fa-duotone fa-solid fa-layer-group',
      active: true,
      onClick: () => decreaseTilesOpacity(),
      button: true
    });
  });
}



// Container PIXI para elementos sempre visíveis
let alwaysVisibleContainer;
let tilesLayer;
let tokensLayer;
let tilesOpacity = 1.0;
let tokensOpacity = 1.0;
let selectedWallId = null;
let lastControlledToken = null;


function updateLayerOpacity(layer, opacity) {
  if (!layer) return;
  layer.children.forEach(sprite => {
      sprite.alpha = opacity;
  });
}

export function updateTilesOpacity(value) {
  tilesOpacity = Math.max(0, Math.min(1, value));
  if (tilesLayer) {
    updateLayerOpacity(tilesLayer, tilesOpacity);
  }
}

export function increaseTilesOpacity() {
  updateTilesOpacity(tilesOpacity + 0.5);
}

export function decreaseTilesOpacity() {
  updateTilesOpacity(tilesOpacity - 0.5);
}

export function resetOpacity() {
  tilesOpacity = 1.0;
  updateTilesOpacity(tilesOpacity);

  //tokensOpacity = 1.0;
  //updateTokensOpacity(tokensOpacity);
}

/*
export function updateTokensOpacity(value) {
  tokensOpacity = Math.max(0, Math.min(1, value));
  if (tokensLayer) {
      updateLayerOpacity(tokensLayer, tokensOpacity);
  }
}

export function increaseTokensOpacity() {
  updateTokensOpacity(tokensOpacity + 0.1);
}

export function decreaseTokensOpacity() {
  updateTokensOpacity(tokensOpacity - 0.1);
}
*/





function cloneTileSprite(tile, wall) {
  const sprite = new PIXI.Sprite(tile.texture);
  sprite.position.set(tile.position.x, tile.position.y);
  sprite.anchor.set(tile.anchor.x, tile.anchor.y);
  sprite.angle = tile.angle;
  sprite.scale.set(tile.scale.x, tile.scale.y);
  
  // Verifica se a wall é uma porta e está aberta
  let alpha = tile.alpha * tilesOpacity;
  if (wall && (wall.document.door === 1 || wall.document.door === 2) && wall.document.ds === 1) {
    return null; // Não cria o sprite se a porta estiver aberta
  }
  
  sprite.alpha = alpha;
  sprite.eventMode = 'passive';
  sprite.originalTile = tile;
  return sprite;
}

function cloneTokenSprite(token) {
  if (!token || !token.texture) {
    if (game.settings.get(MODULE_ID, "debug")) { console.warn("Dynamic Tile cloneTokenSprite() common error.") }
    return null;
  }
  try {
    const sprite = new PIXI.Sprite(token.texture);
    sprite.position.set(token.position.x, token.position.y);
    sprite.anchor.set(token.anchor.x, token.anchor.y);
    sprite.angle = token.angle;
    sprite.scale.set(token.scale.x, token.scale.y);
    sprite.alpha = token.alpha * tokensOpacity;
    sprite.eventMode = 'passive';
    sprite.originalToken = token;
    return sprite;
  } catch (error) {
    console.error("Erro ao clonar sprite do token:", error);
    return null;
  }
}

// Função para encontrar o token inicial na inicialização
function getInitialToken() {
  // Primeiro, tenta pegar o token controlado
  const controlled = canvas.tokens.controlled[0];
  if (controlled) return controlled;

  // Se não houver token controlado, tenta usar o último token conhecido
  if (lastControlledToken) return lastControlledToken;

  // Se não houver último token conhecido, tenta pegar o token do personagem do usuário
  const actor = game.user.character;
  if (actor) {
      const userToken = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
      if (userToken) return userToken;
  }

  // Se ainda não encontrou, pega o primeiro token que o usuário possui permissão
  const availableToken = canvas.tokens.placeables.find(t => t.observer);
  if (availableToken) return availableToken;

  // Se tudo falhar, retorna null
  return null;
}

function updateAlwaysVisibleElements() {
  if (!canvas.ready || !alwaysVisibleContainer) return;

  // Limpa as camadas
  tilesLayer.removeChildren();
  tokensLayer.removeChildren();

  // Obtém o token selecionado
  const controlled = getInitialToken();
  if (!controlled) return;

  // Coleta tiles com paredes vinculadas
  const tilesWithLinkedWalls = canvas.tiles.placeables.filter(tile => 
    tile.document.getFlag(MODULE_ID, 'linkedWallId') !== null
  );

  // Atualiza tiles
  tilesWithLinkedWalls.forEach(tile => {
    const linkedWallId = tile.document.getFlag(MODULE_ID, 'linkedWallId');
    const wall = canvas.walls.get(linkedWallId);
    
    // Verifica se o token pode ver a parede vinculada
    if (wall && canTokenSeeWall(controlled, wall)) {
      const clonedSprite = cloneTileSprite(tile.mesh, wall);
      // Só adiciona o sprite se ele foi criado (não é null)
      if (clonedSprite) {
        tilesLayer.addChild(clonedSprite);
      }
    }
  });

  // Adiciona sempre o token controlado
  const controlledTokenSprite = cloneTokenSprite(controlled.mesh);
  if (controlledTokenSprite) {  // Verifica se o sprite foi criado com sucesso
    tokensLayer.addChild(controlledTokenSprite);
  }

  // Adiciona tokens que o token controlado pode ver
  canvas.tokens.placeables.forEach(token => {
    if (!token.mesh) return;  // Pula se o mesh não existir
    if (token.id === controlled.id) return; // Pula o token controlado (já foi adicionado)

    // Verifica se o token pode ser visto
    if (canTokenSeeToken(controlled, token)) {
      // Verifica se o token está atrás de algum tile vinculado a uma parede
      const behindTiles = tilesWithLinkedWalls.filter(tile => {
        const linkedWallId = tile.document.getFlag(MODULE_ID, 'linkedWallId');
        const wall = canvas.walls.get(linkedWallId);
        
        if (!wall) return false;

        // Se a wall for uma porta e estiver aberta, não considera o token como "atrás"
        if ((wall.document.door === 1 || wall.document.door === 2) && wall.document.ds === 1) {
          return false;
        }
        
        // Verifica se o token está acima da parede
        return isTokenInFrontOfWall(token, wall);
      });

      const tokenSprite = cloneTokenSprite(token.mesh);
      
      // Se estiver atrás de algum tile, ajusta a posição
      if (behindTiles.length > 0) {
        tokenSprite.zIndex = -1; // Renderiza atrás
      }

      tokensLayer.addChild(tokenSprite);
    }
  });

  updateLayerOpacity(tilesLayer, tilesOpacity);
  //updateLayerOpacity(tokensLayer, tokensOpacity);

  // Habilita o zIndex para a camada de tokens
  tokensLayer.sortableChildren = true;
}












// Funções auxiliares para os calculos de posição


/**

  --- Regras para determinar visibilidade, partindo de um ponto de vista 2D (top-down) ---

- Se a parede estiver na horizontal: Qualquer ponto que o token estiver abaixo da linha horizontal é
considerado que ele esteja em frente a parede. Senão ele está atrás da parede.

- Se a parede estiver na vertical: Qualquer ponto que o token estiver à esquerda da linha vertical que
a parede faz, ele é considerado estar em frente a parede. Senão ele está atrás da parede.

- Se a parede estiver inclinada com o sentido desta barra / e o angulo que ela faz com uma reta
horizontal é menor que 45º: Trace uma linha infinita entre os dois pontos que formam a parede.
Faça a diferença entre o ponto Y do token e o ponto y da linha sob o mesmo valor de X. Se essa
diferença for positiva, o token está em frente a parede, senão ele está atrás da parede.

- Se a parede estiver inclinada com o sentido desta barra \ e o angulo que ela faz com uma reta
horizontal é menor que 45º: Trace uma linha infinita entre os dois pontos que formam a parede.
Faça a diferença entre o ponto Y do token e o ponto y da linha sob o mesmo valor de X. Se essa
diferença for positiva, o token está em frente a parede, senão ele está atrás da parede.

- Se a parede estiver inclinada com o sentido desta barra / e o angulo que ela faz com uma reta
horizontal é maior que 45º: Trace uma linha infinita entre os dois pontos que formam a parede.
Faça a diferença entre o ponto Y do token e o ponto y da linha sob o mesmo valor de X. Se essa
diferença for positiva, o token está atrás da parede, senão ele está na frente da parede.

- Se a parede estiver inclinada com o sentido desta barra \ e o angulo que ela faz com uma reta
horizontal é maior que 45º: Trace uma linha infinita entre os dois pontos que formam a parede.
Faça a diferença entre o ponto Y do token e o ponto y da linha sob o mesmo valor de X. Se essa
diferença for positiva, o token está em frente a parede, senão ele está atrás da parede.
 
*/

/**
 * Calcula o ângulo em graus entre uma linha e a horizontal
 * @param {number} x1 - Coordenada X do primeiro ponto
 * @param {number} y1 - Coordenada Y do primeiro ponto
 * @param {number} x2 - Coordenada X do segundo ponto
 * @param {number} y2 - Coordenada Y do segundo ponto
 * @returns {number} - Ângulo em graus (0-360)
 */
function calculateAngle(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * (180 / Math.PI);
  return angle;
}



/**
* Determina se a parede está inclinada no sentido / ou \
* @param {number} x1 - Coordenada X do primeiro ponto
* @param {number} y1 - Coordenada Y do primeiro ponto
* @param {number} x2 - Coordenada X do segundo ponto
* @param {number} y2 - Coordenada Y do segundo ponto
* @returns {string} - 'forward' para / ou 'backward' para \
*/
function getWallDirection(x1, y1, x2, y2) {
  // Se y2 for menor que y1 quando x2 é maior que x1, é uma parede '/'
  // Caso contrário, é uma parede '\'
  if (x2 > x1) {
    return y2 < y1 ? 'forward' : 'backward';
  } else {
    return y2 > y1 ? 'forward' : 'backward';
  }
}



/**
* Verifica se um token está em frente a uma parede baseado nas regras especificadas
* @param {Object} token - Objeto token com propriedade center {x, y}
* @param {Object} wall - Objeto wall com propriedades edge.a {x, y} e edge.b {x, y}
* @returns {boolean} - true se o token estiver em frente à parede, false caso contrário
*/
function isTokenInFrontOfWall(token, wall) {
  if (!wall?.edge?.a || !wall?.edge?.b || !token?.center) {
    return false;
  }

  const { x: x1, y: y1 } = wall.edge.a;
  const { x: x2, y: y2 } = wall.edge.b;
  const { x: tokenX, y: tokenY } = token.center;

  // Verifica se a parede é horizontal (ângulo próximo a 0°)
  // Token está em frente se estiver abaixo da linha horizontal
  if (Math.abs(y1 - y2) < 0.001) {
    return tokenY > y1;
  }

  // Verifica se a parede é vertical (ângulo próximo a 90°)
  // Token está em frente se estiver à esquerda da linha vertical
  if (Math.abs(x1 - x2) < 0.001) {
    return tokenX < x1;
  }

  // Calcula o ângulo da parede com a horizontal
  const angle = calculateAngle(x1, y1, x2, y2);
  
  // Determina a direção da inclinação da parede (/ ou \)
  const wallDirection = getWallDirection(x1, y1, x2, y2);

  // Calcula a posição Y na linha da parede para o X do token
  const slope = (y2 - y1) / (x2 - x1);
  const wallYAtTokenX = slope * (tokenX - x1) + y1;
  const difference = tokenY - wallYAtTokenX;

  if (wallDirection === 'forward') { // Parede tipo /
    if (angle < 45) {
      return difference > 0; // Token está em frente se estiver acima da linha
    } else {
      return difference < 0; // Token está em frente se estiver abaixo da linha
    }
  } else { // Parede tipo \
    if (angle < 45) {
      return difference > 0; // Token está em frente se estiver acima da linha
    } else {
      return difference > 0; // Token está em frente se estiver acima da linha
    }
  }
}



/**
* Verifica se um token pode ver uma parede
* @param {Object} token - Objeto token
* @param {Object} wall - Objeto wall
* @returns {boolean} - true se o token puder ver a parede, false caso contrário
*/
function canTokenSeeWall(token, wall) {
  if (!wall || !token) return false;

  // Verifica se o token está em frente à parede
  const isInFront = isTokenInFrontOfWall(token, wall);
  if (!isInFront) return false;

  // Verifica colisão com outros objetos entre o token e os pontos da parede
  const wallPoints = [wall.edge.a, wall.center, wall.edge.b];
  const tokenPosition = token.center;

  for (const point of wallPoints) {
    const ray = new Ray(tokenPosition, point);
    const collision = CONFIG.Canvas.polygonBackends.sight.testCollision(ray.B, ray.A, { 
      mode: "any", 
      type: "sight" 
    });
    
    // Se não houver colisão com nenhum ponto, o token pode ver a parede
    if (!collision) {
      return true;
    }
  }

  return false;
}



function canTokenSeeToken(sourceToken, targetToken) {
  if (!sourceToken || !targetToken) return false;

  const ray = new Ray(sourceToken.center, targetToken.center);
  const collision = CONFIG.Canvas.polygonBackends.sight.testCollision(ray.A, ray.B, { 
    mode: "any", 
    type: "sight" 
  });
  
  return !collision;
}



















