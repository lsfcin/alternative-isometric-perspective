import { MODULE_ID } from './main.js';
import { isoToCartesian,
  cartesianToIso,
  calculateIsometricVerticalDistance
} from './utils.js';

// Função principal que muda o canvas da cena
export function applyIsometricPerspective(scene, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const isoAngle = Math.PI/6;
  //const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isIsometric) {
    canvas.app.stage.rotation = -isoAngle;
    canvas.app.stage.skew.set(isoAngle, 0);
    adjustAllTokensAndTilesForIsometric();
  } else {
    canvas.app.stage.rotation = 0;
    canvas.app.stage.skew.set(0, 0);
  }
}



// Função auxiliar que chama a função de transformação isométrica em todos os tokens e tiles da cena
export function adjustAllTokensAndTilesForIsometric() {
  canvas.tokens.placeables.forEach(token => applyIsometricTransformation(token, true));
  canvas.tiles.placeables.forEach(tile => applyIsometricTransformation(tile, true));
}



// Função auxiliar que chama a função de transformação isométrica em um objeto específico da cena (token ou tile)
export function applyTokenTransformation(token, isIsometric) {
  applyIsometricTransformation(token, isIsometric);
}



// Função que aplica a transformação isométrica para um token ou tile -------------------------------------------------
export function applyIsometricTransformation(object, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  //let reverseTransform = object.document.getFlag(MODULE_ID, "reverseTransform") ?? false;
  
  if (!object.mesh) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Mesh não encontrado:", object);
    }
    return;
  }



  if (isometricWorldEnabled && isIsometric) { // && !reverseTransform
    // desfaz rotação e deformação
    object.mesh.rotation = Math.PI/4;
    object.mesh.skew.set(0, 0);
      
    // recupera as características de dimensões do objeto (token/tile)
    let texture = object.texture;
    let tileScale = object.document.texture;
    let tileHeight = object.height;
    let tileWidth = object.width;
    let originalWidth = texture.width;   // art width
    let originalHeight = texture.height; // art height
    let ratio = originalWidth / originalHeight;
    let scaleX = object.document.width;  // scale for 2x2, 3x3 tokens
    let scaleY = object.document.height; // scale for 2x2, 3x3 tokens

    // elevation info
    let elevation = object.document.elevation; // elevation from tokens and tiles
    let gridSize = canvas.scene.grid.size;
    let gridDistance = canvas.scene.grid.distance;
    let gridSizeRatio = gridSize / 100;
    let isoScale = object.document.getFlag(MODULE_ID, 'scale') ?? 1; // dynamic scale 
    
    const ElevationAdjustment = game.settings.get(MODULE_ID, "enableHeightAdjustment");
    if (!ElevationAdjustment) elevation = 0;    
    
    
    
    
    
    // Se o objeto for um Token
    if (object instanceof Token) {
      // orienta a arte para ser gerada sempre do vertice esquerdo
      object.mesh.anchor.set(0, 1);
      object.mesh.scale.set(
        scaleX * isoScale * gridSizeRatio,
        scaleY * isoScale * gridSizeRatio * Math.sqrt(3)
      );
      
      // define o offset manual para centralizar o token
      let offsetX = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      let offsetY = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;
      
      // calculo referente a elevação 
      offsetX = offsetX + ((elevation * gridSize * Math.sqrt(2)) / gridDistance); //(elevation * gridDistance * Math.sqrt(3))
      
      // distâncias transformadas
      const isoOffsets = cartesianToIso(offsetX, offsetY);
      
      // criar elementos gráficos de sombra e linha
      updateTokenVisuals(
        object,
        elevation,
        object.document.x + (isoOffsets.x * scaleX),
        object.document.y + (isoOffsets.y * scaleY)
      );

      // posiciona o token
      object.mesh.position.set(
        object.document.x + (isoOffsets.x * scaleX),
        object.document.y + (isoOffsets.y * scaleY)
      );
    }

    
    
    
    
    
    
    // Se o objeto for um Tile
    else if (object instanceof Tile) {
      // Aplicar a escala mantendo a proporção da arte original
      object.mesh.scale.set(
        (scaleX / originalWidth) * isoScale,
        (scaleY / originalHeight) * isoScale * Math.sqrt(3)
      );
      
      // define o offset manual para centralizar o tile
      let offsetX = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      let offsetY = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;
      let isoOffsets = cartesianToIso(offsetX, offsetY);
      
      // Aplicar a posição base do tile
      object.mesh.position.set(
        object.document.x + (scaleX / 2) + isoOffsets.x,
        object.document.y + (scaleY / 2) + isoOffsets.y
      );
    }
  
  
  
  
  } else {
    // Reseta todas as transformações do mesh
    object.mesh.rotation = 0;
    object.mesh.skew.set(0, 0);
    object.mesh.scale.set(1, 1);
    object.mesh.position.set(object.document.x, object.document.y);
    object.mesh.anchor.set(0, 0);
  }
}





// Função para transformar o background da cena
export function applyBackgroundTransformation(scene, isIsometric, shouldTransform) {
  if (!canvas?.primary?.background) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Background não encontrado");
    }
    return;
  }

  //console.log(scene);
  //console.log(scene); versão melhorada
  // para afetar o canvas dentro do grid configuration tool
  // modificar o canvas.stage resolve, mas ele não tem como transformar a arte
  //const background = scene.stage.background;

  const background = canvas.environment.primary.background;
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isIsometric && shouldTransform) {
    // Aplica rotação isométrica
    background.rotation = Math.PI/4;
    background.skew.set(0, 0);
    background.anchor.set(0.5, 0.5);
    background.transform.scale.set(
      scale,
      scale * Math.sqrt(3)
    );
    
    // Calculate scene dimensions and padding
    const isoScene = canvas.scene;
    const padding = isoScene.padding;
    const paddingX = isoScene.width * padding;
    const paddingY = isoScene.height * padding;
      
    // Account for background offset settings
    const offsetX = isoScene.background.offsetX || 0;
    const offsetY = isoScene.background.offsetY || 0;
    
    // Set position considering padding and offset
    background.position.set(
      (isoScene.width / 2) + paddingX + offsetX,
      (isoScene.height / 2) + paddingY + offsetY
    );
    
    // Handle foreground if it exists
    /*if (canvas.environment.primary.foreground) {
      const foreground = canvas.environment.primary.foreground;
      foreground.anchor.set(0.5, 0.5);
      foreground.transform.scale.set(1, 1);
      foreground.transform.setFromMatrix(canvas.stage.transform.worldTransform.invert());
      foreground.position.set(
        (s.width / 2) + paddingX + (s.foreground?.offsetX || 0),
        (s.height / 2) + paddingY + (s.foreground?.offsetY || 0)
      );
    }*/

  } else {
    // Reset transformações
    background.rotation = 0;
    background.skew.set(0, 0);
    //background.transform.scale.set(1, 1);
    //background.anchor.set(0.5, 0.5);
    //background.scale.set(1, 1);
    //background.transform.position.set(canvas.scene.width/2, canvas.scene.height/2);
    
    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("applyBackgroundTransformation RESET");
    }
  }
}



export function updateTokenVisuals(token, elevacao, positionX, positionY) {
  // Primeiro, remova qualquer representação visual existente, se necessário
  removeTokenVisuals(token);

  // Tente encontrar o container de visual do token
  let container = canvas.stage.getChildByName(`${token.id}-visuals`);

  // Se o container não existir, cria um novo e adiciona ao canvas
  if (!container) {
    container = new PIXI.Container();
    container.name = `${token.id}-visuals`;
    container.interactive = false; // Desativar interatividade para o container
    container.interactiveChildren = false; // Garantir que filhos não sejam interativos
    canvas.stage.addChild(container);
  } else {
    // Se o container já existe, limpa qualquer elemento existente para evitar duplicação
    container.removeChildren();
  }

  if (elevacao > 0) {
    // Criar uma sombra circular no chão
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.3); // Sombra preta com 30% de opacidade
    shadow.drawCircle(0, 0, (canvas.grid.size/2) * (token.h/canvas.grid.size)); // Tamanho da sombra baseado no grid
    shadow.endFill();
    shadow.position.set(
      token.x + token.h / 2, 
      token.y + token.h / 2); // Centralizar na célula do token
    container.addChild(shadow);

    // Criar uma linha conectando o chão ao token
    const line = new PIXI.Graphics();
    line.lineStyle(2, 0xff0000, 0.5); // Linha vermelha com espessura 2 e alpha 50%
    line.moveTo(
      token.x + token.h / 2,
      token.y + token.h / 2
    ).lineTo(
      positionX,
      positionY + token.h / 2
    );
    container.addChild(line);
  }
}


// Remove as representações visuais (sombra e linha) de um token.
export function removeTokenVisuals(token) {
  const shadow = canvas.stage.getChildByName(`${token.id}-shadow`);
  if (shadow) {
    canvas.stage.removeChild(shadow);
  }

  const line = canvas.stage.getChildByName(`${token.id}-line`);
  if (line) {
    canvas.stage.removeChild(line);
  }
}

