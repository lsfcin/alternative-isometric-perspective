import { MODULE_ID } from './main.js';
import { applyTokenTransformation, updateTokenVisuals } from './transform.js';

export function registerTokenConfig() {
  Hooks.on("renderTokenConfig", handleRenderTokenConfig);

  Hooks.on("createToken", handleCreateToken);
  Hooks.on("updateToken", handleUpdateToken);
  Hooks.on("refreshToken", handleRefreshToken);
  Hooks.on("deleteToken", handleDeleteToken);
}


async function handleRenderTokenConfig(app, html, data) {
  // Carrega o template HTML para a nova aba
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/token-config.html", {
    isoDisabled: app.object.getFlag(MODULE_ID, 'isoTokenDisabled') ?? 1,
    offsetX: app.object.getFlag(MODULE_ID, 'offsetX') ?? 0,
    offsetY: app.object.getFlag(MODULE_ID, 'offsetY') ?? 0,
    scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1
  });
  
  // Adiciona a nova aba ao menu
  const tabs = html.find('.tabs:not(.secondary-tabs)');
  tabs.append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');
  
  // Adiciona o conteúdo da aba após a última aba existente
  const lastTab = html.find('.tab').last();
  lastTab.after(tabHtml);

  // Inicializa os valores dos controles
  const isoTokenCheckbox = html.find('input[name="flags.isometric-perspective.isoTokenDisabled"]');
  isoTokenCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "isoTokenDisabled"));

  // Adiciona listener para atualizar o valor exibido do slider
  html.find('.scale-slider').on('input', function() {
    html.find('.range-value').text(this.value);
  });

  // Handler para o formulário de submit
  html.find('form').on('submit', async (event) => {
    // Se o valor do checkbox é true, atualiza as flags com os novos valores
    if (isoTokenCheckbox.prop("checked")) {
      await app.object.setFlag(MODULE_ID, "isoTokenDisabled", true);
    } else {
      await app.object.unsetFlag(MODULE_ID, "isoTokenDisabled");
    }
  });

  // Corrige a inicialização das tabs
  if (!app._tabs || app._tabs.length === 0) {
    app._tabs = [new Tabs({
      navSelector: ".tabs",
      contentSelector: ".sheet-body",
      initial: "appearance",
      callback: () => {}
    })];
    app._tabs[0].bind(html[0]);
  }
}




// Hooks.on("createToken")
function handleCreateToken(tokenDocument) {
  const token = canvas.tokens.get(tokenDocument.id);
  if (!token) return;
  
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyTokenTransformation(token, isSceneIsometric);
}


// Hooks.on("updateToken")
function handleUpdateToken(tokenDocument, updateData, options, userId) {
  const token = canvas.tokens.get(tokenDocument.id);
  if (!token) return;
  
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  
  if (updateData.flags?.[MODULE_ID] ||
      updateData.x !== undefined ||
      updateData.y !== undefined ) {
    applyTokenTransformation(token, isSceneIsometric);
  }
}


// Hooks.on("refreshToken")
function handleRefreshToken(token) {
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyTokenTransformation(token, isSceneIsometric);
}


// Hooks.on("deleteToken")
function handleDeleteToken(token) {
  updateTokenVisuals(token);
}






/**
 * @param {Código para ser usado se quiser alterar os controles nativos do foundry}
 * 
Hooks.on('renderTokenConfig', (app, html, data) => {
  // Encontre o input de escala no HTML da janela de configuração do token
  const scaleInput = html.find('input[name="scale"]');

  // Modifique o atributo "step" do input para 0.01
  scaleInput.attr('step', 0.01);
});
*/