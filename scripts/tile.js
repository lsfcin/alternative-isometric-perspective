import { MODULE_ID, DEBUG_PRINT, WORLD_ISO_FLAG } from './main.js';
import { applyIsometricTransformation } from './transform.js';

export function registerTileConfig() {
  Hooks.on("renderTileConfig", handleRenderTileConfig);

  Hooks.on("createTile", handleCreateTile);
  Hooks.on("updateTile", handleUpdateTile);
  Hooks.on("refreshTile", handleRefreshTile);
}

async function handleRenderTileConfig(app, html, data) {
  // Carrega o template HTML para a nova aba
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/tile-config.html", {
    isoDisabled: app.object.getFlag(MODULE_ID, 'isoTileDisabled') ?? 1,
    scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1,
    isFlipped: app.object.getFlag(MODULE_ID, 'tokenFlipped') ?? false,
    offsetX: app.object.getFlag(MODULE_ID, 'offsetX') ?? 0,
    offsetY: app.object.getFlag(MODULE_ID, 'offsetY') ?? 0,
    linkedWallId: app.object.getFlag(MODULE_ID, 'linkedWallId') || null
  });

  // Adiciona a nova aba ao menu
  const tabs = html.find('.tabs:not(.secondary-tabs)');
  tabs.append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');

  // Adiciona o conteúdo da aba após a última aba existente
  const lastTab = html.find('.tab').last();
  lastTab.after(tabHtml);

  // keeps the window height on auto
  /*
  const sheet = html.closest('.sheet');
  if (sheet.length) {
    sheet.css({ 'height': 'auto', 'min-height': '0' });
    const windowContent = sheet.find('.window-content');
    if (windowContent.length) {
      windowContent.css({ 'height': 'auto', 'overflow': 'visible' });
    }
  }
  */

  // Inicializa os valores dos controles
  const isoTileCheckbox = html.find('input[name="flags.isometric-perspective.isoTileDisabled"]');
  const flipCheckbox = html.find('input[name="flags.isometric-perspective.tokenFlipped"]');
  const linkedWallInput = html.find('input[name="flags.isometric-perspective.linkedWallId"]');
  
  isoTileCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "isoTileDisabled"));
  flipCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "tokenFlipped"));
  linkedWallInput.val(app.object.getFlag(MODULE_ID, 'linkedWallId') || '');
  
  // Adiciona listener para atualizar o valor exibido do slider
  html.find('.scale-slider').on('input', function() {
    html.find('.range-value').text(this.value);
  });

  
  // Handler para o formulário de submit
  html.find('form').on('submit', async (event) => {
    // Se o valor do checkbox é true, atualiza as flags com os novos valores
    if (html.find('input[name="flags.isometric-perspective.isoTileDisabled"]').prop("checked")) {
      await app.object.setFlag(MODULE_ID, "isoTileDisabled", true);
    } else {
      await app.object.unsetFlag(MODULE_ID, "isoTileDisabled");
    }

    if (html.find('input[name="flags.isometric-perspective.tokenFlipped"]').prop("checked")) {
      await app.object.setFlag(MODULE_ID, "tokenFlipped", true);
    } else {
      await app.object.unsetFlag(MODULE_ID, "tokenFlipped");
    }

    // dynamictile.js linked wall logic
    if (linkedWallInput.val()) {
      await app.object.setFlag(MODULE_ID, 'linkedWallId', linkedWallInput.val());
    } else {
      await app.object.unsetFlag(MODULE_ID, 'linkedWallId');
    }
  });

  
  // dynamictile.js event listeners for the buttons
  html.find('button.select-wall').click(() => {
    // Minimiza a janela e muda a camada selecionada para a WallLayer
    Object.values(ui.windows).filter(w => w instanceof TileConfig).forEach(j => j.minimize());
    canvas.walls.activate();

    Hooks.once('controlWall', (wall) => {
      const selectedWallId = wall.id.toString();
      app.object.setFlag(MODULE_ID, 'linkedWallId', selectedWallId);
      html.find('input[name="flags.isometric-perspective.linkedWallId"]').val(selectedWallId);
      
      // Retorna a janela a posição original e ativa a camada TileLayer
      Object.values(ui.windows).filter(w => w instanceof TileConfig).forEach(j => j.maximize());
      canvas.tiles.activate();

      // Keep the tab selected
      requestAnimationFrame(() => {
        const tabs = app._tabs[0];
        if (tabs) tabs.activate("isometric");
      });
      
    });
  });

  html.find('button.clear-wall').click(() => {
    app.object.setFlag(MODULE_ID, 'linkedWallId', null);
    html.find('input[name="flags.isometric-perspective.linkedWallId"]').val('');

    // Keep the tab selected
    requestAnimationFrame(() => {
      const tabs = app._tabs[0];
      if (tabs) tabs.activate("isometric");
    });
  });

}




// Hooks.on("createTile")
function handleCreateTile(tileDocument) {
  const tile = canvas.tiles.get(tileDocument.id);
  if (!tile) return;
  
  const scene = tile.scene;
  const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  requestAnimationFrame(() => applyIsometricTransformation(tile, isSceneIsometric));
}

// Hooks.on("updateTile")
function handleUpdateTile(tileDocument, updateData, options, userId) {
  const tile = canvas.tiles.get(tileDocument.id);
  if (!tile) return;
  
  const scene = tile.scene;
  const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  
  if (updateData.x !== undefined ||
      updateData.y !== undefined ||
      updateData.width !== undefined ||
      updateData.height !== undefined ||
      updateData.texture !== undefined) {
    requestAnimationFrame(() => applyIsometricTransformation(tile, isSceneIsometric));
  }
}

// Hooks.on("refreshTile")
function handleRefreshTile(tile) {
  const scene = tile.scene;
  const isSceneIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(tile, isSceneIsometric);
}