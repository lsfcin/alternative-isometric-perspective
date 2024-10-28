import { MODULE_ID } from './settings.js';
import { applyIsometricPerspective, applyBackgroundTransformation } from './transforms.js';

// Hook para adicionar uma aba de configuração isométrica no menu de configuração da cena.
Hooks.on("renderSceneConfig", async (sceneConfig, html, data) => {
  // Renderiza o template HTML da aba de configuração isométrica
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/scene-config.html");

  // Adiciona a aba isométrica ao menu de configuração
  html.find('nav.sheet-tabs').append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');
  html.find('div.tab[data-tab="ambience"]').after(tabHtml);

  // Inicializa os controles da aba de configuração isométrica
  const isoCheckbox = html.find('input[name="flags.isometric-perspective.isometricEnabled"]');
  const bgCheckbox = html.find('input[name="flags.isometric-perspective.isometricBackground"]');
  const scaleSlider = html.find('input[name="flags.isometric-perspective.isometricScale"]');
  const scaleDisplay = html.find('.range-value');
  
  isoCheckbox.prop("checked", sceneConfig.object.getFlag(MODULE_ID, "isometricEnabled"));
  bgCheckbox.prop("checked", sceneConfig.object.getFlag(MODULE_ID, "isometricBackground"));
  
  const currentScale = sceneConfig.object.getFlag(MODULE_ID, "isometricScale") ?? 1;
  scaleSlider.val(currentScale);
  scaleDisplay.text(currentScale);

  // Atualiza o display do valor quando o slider é movido
  scaleSlider.on('input', function() {
    scaleDisplay.text(this.value);
  });

  // Handler para o formulário de submit que salva as alterações
  html.closest('form').on('submit', async () => {
    const newIsometric = isoCheckbox.prop("checked");
    const newBackground = bgCheckbox.prop("checked");
    const newScale = parseFloat(scaleSlider.val());

    await sceneConfig.object.setFlag(MODULE_ID, "isometricEnabled", newIsometric);
    await sceneConfig.object.setFlag(MODULE_ID, "isometricBackground", newBackground);
    await sceneConfig.object.setFlag(MODULE_ID, "isometricScale", newScale);

    // Aplica as mudanças se a cena ativa for a atual
    if (canvas.scene.id === sceneConfig.object.id) {
      requestAnimationFrame(() => {
        applyIsometricPerspective(sceneConfig.object, newIsometric);
        applyBackgroundTransformation(sceneConfig.object, newIsometric, newBackground);
      });
    }
  });
});

// Hook para adicionar uma aba de configuração isométrica no menu de configuração do token.
Hooks.on("renderTokenConfig", async (app, html, data) => {
  // Carrega o template da aba de configuração isométrica para tokens
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/token-config.html", {
    offsetX: app.object.getFlag(MODULE_ID, 'offsetX') ?? 0,
    offsetY: app.object.getFlag(MODULE_ID, 'offsetY') ?? 0,
    scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1
  });

  // Adiciona a aba isométrica e seu conteúdo ao menu de configuração do token
  html.find('.tabs').append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');
  html.find('.tab').last().after(tabHtml);

  // Listener para atualizar o valor exibido do slider
  html.find('.scale-slider').on('input', function() {
    html.find('.range-value').text(this.value);
  });

  // Re-inicializa as tabs se necessário
  if (!app._tabs || app._tabs.length === 0) {
    app._tabs = [new Tabs({
      navSelector: ".tabs",
      contentSelector: ".sheet-body",
      initial: "appearance"
    })];
    app._tabs[0].bind(html[0]);
  }
});

// Hook para adicionar uma aba de configuração isométrica no menu de configuração de tiles.
Hooks.on("renderTileConfig", async (app, html, data) => {
  // Carrega o template da aba de configuração isométrica para tiles
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/tile-config.html", {
    reverseTransform: app.object.getFlag(MODULE_ID, 'reverseTransform') ?? true,
    scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1
  });

  // Adiciona a aba isométrica e seu conteúdo ao menu de configuração do tile
  html.find('.tabs').append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');
  html.find('.tab').last().after(tabHtml);

  // Listener para atualizar o valor exibido do slider
  html.find('.scale-slider').on('input', function() {
    html.find('.range-value').text(this.value);
  });

  // Re-inicializa as tabs se necessário
  if (!app._tabs || app._tabs.length === 0) {
    app._tabs = [new Tabs({
      navSelector: ".tabs",
      contentSelector: ".sheet-body",
      initial: "image"
    })];
    app._tabs[0].bind(html[0]);
  }
});
