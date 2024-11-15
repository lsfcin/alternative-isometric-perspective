import { MODULE_ID } from './main.js';
import { applyIsometricTransformation } from './transform.js';

export function registerTileConfig() {


  Hooks.on("renderTileConfig", async (app, html, data) => {
    // Carrega o template HTML para a nova aba
    const tabHtml = await renderTemplate("modules/isometric-perspective/templates/tile-config.html", {
      isoDisabled: app.object.getFlag(MODULE_ID, 'isoTileDisabled') ?? 1,
      scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1,
      isFlipped: app.object.getFlag(MODULE_ID, 'tokenFlipped') ?? false,
      offsetX: app.object.getFlag(MODULE_ID, 'offsetX') ?? 0,
      offsetY: app.object.getFlag(MODULE_ID, 'offsetY') ?? 0
    });
    
    // Adiciona a nova aba ao menu
    const tabs = html.find('.tabs:not(.secondary-tabs)');
    tabs.append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');

    // Adiciona o conteúdo da aba após a última aba existente
    const lastTab = html.find('.tab').last();
    lastTab.after(tabHtml);

    // Inicializa os valores dos controles
    const isoTileCheckbox = html.find('input[name="flags.isometric-perspective.isoTileDisabled"]');
    const flipCheckbox = html.find('input[name="flags.isometric-perspective.tokenFlipped"]');
    
    isoTileCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "isoTileDisabled"));
    flipCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "tokenFlipped"));

    // Adiciona listener para atualizar o valor exibido do slider
    html.find('.scale-slider').on('input', function() {
      html.find('.range-value').text(this.value);
    });

    // Handler para o formulário de submit
    html.find('form').on('submit', async (event) => {
      // Se o valor do checkbox é true, atualiza as flags com os novos valores
      if (isoTileCheckbox.prop("checked")) {
        await app.object.setFlag(MODULE_ID, "isoTileDisabled", true);
      } else {
          await app.object.unsetFlag(MODULE_ID, "isoTileDisabled");
      }

      if (flipCheckbox.prop("checked")) {
          await app.object.setFlag(MODULE_ID, "tokenFlipped", true);
      } else {
          await app.object.unsetFlag(MODULE_ID, "tokenFlipped");
      }
    });

    // Corrige a inicialização das tabs
    if (!app._tabs || app._tabs.length === 0) {
      app._tabs = [new Tabs({
        navSelector: ".tabs",
        contentSelector: ".sheet-body",
        initial: "image",
        callback: () => {}
      })];
      app._tabs[0].bind(html[0]);
    }
  });




  /*
  // Hook para definir flags padrão antes da criação do Tile
  Hooks.on("preCreateTile", (tileDocument, createData, options, userId) => {
    
    // Define a flag 'scale' com valor padrão 1
    setProperty(createData, `flags.${MODULE_ID}.scale`, 1);
    
    const tile = canvas.tiles.get(tileDocument.id);
    console.log(tileDocument);
    tileDocument.setFlag(MODULE_ID, 'scale', 1);

    //errado também
    //tileDocument.setFlag(MODULE_ID, "scale", 1);
  });
  */

  /* versão nova mas errada
  Hooks.on("preCreateTile", (tileDocument, createData, options, userId) => {
    // Define a flag 'scale' com valor padrão 1
    createData.flags[MODULE_ID] = createData.flags[MODULE_ID] || {};
    createData.flags[MODULE_ID].scale = 1;
  });
  */



  Hooks.on("createTile", (tileDocument) => {
    const tile = canvas.tiles.get(tileDocument.id);
    if (!tile) return;
    
    const scene = tile.scene;
    const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
    requestAnimationFrame(() => applyIsometricTransformation(tile, isSceneIsometric));
  });



  Hooks.on("updateTile", (tileDocument, updateData, options, userId) => {
    const tile = canvas.tiles.get(tileDocument.id);
    if (!tile) return;
    
    const scene = tile.scene;
    const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
    
    if (updateData.x !== undefined ||
        updateData.y !== undefined ||
        updateData.width !== undefined ||
        updateData.height !== undefined ||
        updateData.texture !== undefined
      ){
        requestAnimationFrame(() => applyIsometricTransformation(tile, isSceneIsometric));
      }
  });



  Hooks.on("refreshTile", (tile) => {
    const scene = tile.scene;
    const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
    applyIsometricTransformation(tile, isSceneIsometric);
  });

}