import { registerSceneConfig } from './scene.js';
import { registerTokenConfig } from './token.js';
import { registerTileConfig } from './tile.js';
import { registerHUDConfig } from './hud.js';
import { registerOcclusionConfig } from './occlusion.js';
import { registerDynamicTileConfig } from './dynamictile.js';
//import { TokenEffectModule } from './occlusion.js';
import { applyIsometricPerspective, applyBackgroundTransformation } from './transform.js';

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
    hint: 'Toggle whether token sprites adjust their position to reflect their elevation',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'enableTokenVisuals', {
    name: 'Enable Token Visuals',
    hint: 'Displays a circular shadow and a vertical red line to indicate token elevation. Requires "Enable Height Adjustment" to be active.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, 'enableOcclusionDynamicTile', {
    name: 'Enable Occlusion: Dynamic Tile',
    hint: ' (THIS FEATURE IS IN WORKING PROGRESS AND WASN\'T TESTED. USE WITH CAUTION) Adjusts the visibility of tiles dynamically with the positioning of tokens. See how this feature works here.',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });

  /*
  game.settings.register(MODULE_ID, 'enableOcclusionTokenSilhouette', {
    name: 'Enable Occlusion: Token Silhouette',
    hint: 'Adjusts the visibility of tiles dynamically with the positioning of tokens. See how this feature works here.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
  });
  */
  
  game.settings.register(MODULE_ID, 'debug', {
    name: 'Enable Debug Mode',
    hint: 'Enables debug prints.',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true
    //onChange: settings => window.location.reload()
  });

  //TokenEffectModule.initialize();

  // Registra as configurações do módulo
  registerSceneConfig();
  registerTokenConfig();
  registerTileConfig();
  registerHUDConfig();
  //registerOcclusionConfig();
  registerDynamicTileConfig();
});



// Aplica a perspectiva isométrica aos tokens, tiles e background quando a cena termina de ser renderizada
Hooks.on("canvasReady", (canvas) => {
  const activeScene = game.scenes.active;
  if (!activeScene) return;

  const scene = canvas.scene;
  const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;
  applyIsometricPerspective(scene, isSceneIsometric);
  applyBackgroundTransformation(scene, isSceneIsometric, shouldTransformBackground);
});



// Aplica a perspectiva isométrica ao background quando a cena for redimensionada
Hooks.on("canvasResize", (canvas) => {
  const scene = canvas.scene;
  if (!scene) return;
  
  const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;
  
  if (isSceneIsometric && shouldTransformBackground) {
    applyBackgroundTransformation(scene, isSceneIsometric, shouldTransformBackground);
  }
});











/**
 * @param {----- TESTING AREA / ÁREA DE TESTES -----}
*/

/*
// Adicionar botões personalizados na barra de ferramentas lateral
Hooks.on("getSceneControlButtons", (controls) => {
  // Encontre o grupo onde você quer adicionar o botão, ou crie um novo grupo
  controls.push({
    name: "custom-tools",
    title: "Ferramentas Customizadas",
    icon: "fas fa-tools", // Ícone do Font Awesome
    layer: "TokenLayer",
    tools: [
      {
        name: "botao1",
        title: "Botão 1",
        icon: "fas fa-dice-d20", // Ícone do Font Awesome
        onClick: () => {
          ui.notifications.info("Botão 1 clicado!");
        },
        button: true,
      },
      {
        name: "botao2",
        title: "Botão 2",
        icon: "fas fa-magic", // Ícone do Font Awesome
        onClick: () => {
          ui.notifications.info("Botão 2 clicado!");
        },
        button: true,
      },
      {
        name: "botao3",
        title: "Botão 3",
        icon: "fas fa-book", // Ícone do Font Awesome
        onClick: () => {
          ui.notifications.info("Botão 3 clicado!");
        },
        button: true,
      }
    ]
  });

});
*/


Hooks.on("getSceneControlButtons", (controls) => {
  const newButtons = controls.find(b => b.name === "tiles"); // "token, measure, tiles, drawings, walls, lightning"

  newButtons.tools.push({
    name: 'select-templates',
    title: 'Toggle 2',
    icon: 'fa-duotone fa-solid fa-layer-group',
    toggle: true,
    active: true,
    onClick: (toggle) => {
      if (toggle) {
        console.log("sim");
      } else {
        console.log("não");
      }
    }
  },
  {
    name: "dtaligntool", // just some identifier
    title: "coisina",  // more like the label shown in the tooltip
    icon: "fa fa-circle",  // a FontAwesome icon to show
    visible: game.user.isGM,  // whether to show the control or not, a boolean or a function that returns a boolean
    onClick: () => {
      console.log("geag");
    },
    button: true  // just being explicit that it should be a button rather than a toggle
  },{
    name: 'select-templates',
    title: 'Select Templates',
    icon: 'fa-solid fa-layer-group',
    toggle: true,
    active: true,
    onClick: (toggle) => {
      if (toggle) {
        console.log("template sim");
      } else {
        console.log("template não");
      }
    }
  },{
    name: 'select-templates',
    title: 'Toggle',
    icon: 'fa-solid fa-eye-low-vision',
    active: true,
    onClick: () => {
      if (active) {
        console.warn("ok");
      } else {
        console.warn("not ok");
      }
    },
    button: true
  });
});

