// isoCanvas.js
import { registerSceneConfig } from './scene.js';
import { registerTokenConfig } from './token.js';
import { registerTileConfig } from './tile.js';
import { registerHUDConfig } from './hud.js';
import { 
  applyIsometricPerspective,
  adjustAllTokensAndTilesForIsometric, 
  applyTokenTransformation, 
  applyIsometricTransformation, 
  applyBackgroundTransformation, 
  updateTokenVisuals, 
  removeTokenVisuals 
} from './transform.js';

import { isoToCartesian,
  cartesianToIso,
  calculateIsometricVerticalDistance
} from './utils.js';

const MODULE_ID = "isometric-perspective";
export { MODULE_ID };

// Hook para registrar a configuração do módulo no Foundry VTT
Hooks.once("init", function() {
  // Configuração do checkbox para habilitar ou desabilitar o modo isométrico globalmente
  game.settings.register(MODULE_ID, "worldIsometricFlag", {
    name: "Enable Isometric Perspective",
    hint: "Toggle whether the isometric perspective is applied to the canvas.",
    scope: "world",  // "world" = sync to db, "client" = local storage
    config: true,    // false if you dont want it to show in module config
    type: Boolean,   // You want the primitive class, e.g. Number, not the name of the class as a string
    default: true, 
    requiresReload: true // true if you want to prompt the user to reload
    //onChange: settings => window.location.reload() // recarrega automaticamente
  });

  game.settings.register(MODULE_ID, 'enableHeightAdjustment', {
    name: 'Enable Height Adjustment',
    hint: 'Toggle whether tokens adjust their position based on their height',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'debug', {
    name: 'Enable Debug Mode',
    hint: 'Enables debug prints',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
    //onChange: settings => window.location.reload()
  });

  // Registra as configurações do módulo
  registerSceneConfig();
  registerTokenConfig();
  registerTileConfig();
  registerHUDConfig();
});



// Aplica a perspectiva isométrica aos tokens, tiles e background quando a cena termina de ser renderizada
Hooks.on("canvasReady", (canvas) => {
  const activeScene = game.scenes.active;
  if (!activeScene) return;

  const scene = canvas.scene;
  const isIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;
  applyIsometricPerspective(scene, isIsometric);
  applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
});


// Aplica a perspectiva isométrica ao background quando a cena for redimensionada
Hooks.on("canvasResize", (canvas) => {
  const scene = canvas.scene;
  if (!scene) return;
  
  const isIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;
  
  if (isIsometric && shouldTransformBackground) {
    applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
  }
});





// ---------------------------------------------------------------------------------------------------------------------------------
// ------ AMBIENTE DE TESTES -------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------



/*
// Adicionar interface para atribuir wall ao tile na configuração do tile
TileConfig.prototype._updateObject = async function(event, formData) {
  //await super._updateObject(event, formData);
  
  const wallId = formData.wallId; // Supondo que wallId é passado no formData
  this.object.setWallId(wallId);
};

// Código para atribuir tiles a walls e gerenciar visibilidade
Hooks.on("init", () => {
  // Adicionar uma configuração de tile para selecionar uma wall
  Tile.prototype.getWallId = function() {
      return this.flags?.myModule?.wallId || null;
  };

  Tile.prototype.setWallId = function(wallId) {
      if (!this.flags.myModule) {
          this.flags.myModule = {};
      }
      this.flags.myModule.wallId = wallId;
  };
});


// Função para verificar se o token está abaixo de uma wall
function isTokenBelowWall(token, wall) {
  const wallStart = wall.object.bounds.top;
  const wallEnd = wall.object.bounds.bottom;

  const tokenBounds = token.bounds;
  console.log("tokenBounds", tokenBounds);
  const tokenBottomY = tokenBounds.y + tokenBounds.height;
  console.log("wallStart:", wallStart,
              "wallEnd:", wallEnd,
              "tokenBounds:", tokenBounds,
              "tokenBottomY:", tokenBottomY
  );

  return tokenBottomY < wallStart;
}

// Atualizar a visibilidade dos tiles quando um token é selecionado
Hooks.on("updateToken", (token, updates) => {
  console.log("teste 1");
  console.log("TOKEN:", token);
  const tiles = canvas.tiles.placeables;
  const tokenCanvas = canvas.primary.tokens.get(token.id); //??????????????????????????????????????????????????????????????????????????????????????
  console.log("tokenCanvas:", tokenCanvas);
  

  tiles.forEach(tile => {
      console.log("TILE:", tile);
      const wallId = tile.document.getFlag(MODULE_ID, "wallID");
      console.log("wallId", wallId);
      if (wallId) {
          console.log("teste 4");
          const wall = canvas.walls.documentCollection.get(wallId);
          console.log("wall", wall);
          if (wallId) {
              console.log("teste 5");
              const isBelow = isTokenBelowWall(tokenCanvas, wall);
              console.log("teste 6");
              tile.visible = isBelow;
              //tile.update({ visible: tile.visible }, { diff: false });
          }
      }
  });
});
/*
// Atualizar a visibilidade dos tiles quando um token é selecionado
Hooks.on("updateToken", (token, updates) => {
  console.log("teste 1");
  console.log(token);
  if (!updates?.actor) {
      console.log("teste 2");
      const tiles = canvas.tiles.placeables;

      tiles.forEach(tile => {
          console.log("teste 3");
          const wallId = tile.getWallId();
          console.log("wallId", wallId);
          if (!wallId) {
              console.log("teste 4");
              const wall = canvas.walls.get(wallId);
              console.log("wall", wall);
              if (!wall) {
                  console.log("teste 5");
                  const isBelow = isTokenBelowWall(token, wall);
                  tile.visible = isBelow;
                  tile.update({ visible: tile.visible }, { diff: false });
              }
          }
      });
  }
});

Hooks.on("updateToken", (token, updates) => {
  canvas.draw()
})


// Adicionar botão para selecionar wall na configuração do tile
Hooks.on("renderTileConfig", (app, html, data) => {
  const wallDisplay = $('<input type="text" name="wallId" readonly style="width: 100%;">');
  const selectWallButton = $('<button type="button" class="select-wall">Selecionar Wall</button>');

  // Adicionar o campo de texto e o botão na configuração
  html.find("form").prepend(wallDisplay);
  html.find("form").prepend(selectWallButton);

  // Evento para abrir a seleção da wall ao clicar
  selectWallButton.on("click", () => {
      // Ativar a seleção de wall no canvas
      canvas.walls.activate();

      // Registrar o manipulador para capturar cliques na wall
      const selectWallHandler = (event) => {
          const wall = canvas.walls.placeables.find(w => w.hitTest(event.data.global));
          if (wall) {
              const wallId = wall.id;
              wallDisplay.val(wallId); // Exibir o ID da wall selecionada
              app.object.setWallId(wallId); // Atribuir o ID ao tile
              canvas.walls.deactivate(); // Desativar seleção após escolher
              Hooks.off("canvasClick", selectWallHandler); // Remover o manipulador após selecionar
          }
      };

      // Registrar o manipulador de cliques
      Hooks.on("canvasClick", selectWallHandler);
  });
});

// Capturar o evento de controle de wall para identificar qual wall está sendo interagida
Hooks.on("controlWall", (wall) => {
  const activeTile = canvas.tiles.controlled[0]; // Obter o tile atualmente selecionado
  if (activeTile && wall) {
      activeTile.setWallId(wall.id); // Armazenar o ID da wall no tile
  }
});

// Remover a wall associada ao tile
Hooks.on("renderTileConfig", (app, html, data) => {
  const removeWallButton = $('<button type="button" class="remove-wall">Remover Wall</button>');
  html.find("form").prepend(removeWallButton);

  removeWallButton.on("click", () => {
      wallDisplay.val(""); // Limpar o campo de texto
      app.object.setWallId(null); // Remover o ID da wall do tile
  });
});
*/