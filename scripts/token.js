import { MODULE_ID, DEBUG_PRINT, WORLD_ISO_FLAG } from './main.js';
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

  if (DEBUG_PRINT) console.log("Hooks.on token.js updateToken");
}


// Hooks.on("refreshToken")
function handleRefreshToken(token) {
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyTokenTransformation(token, isSceneIsometric);
  
  if (DEBUG_PRINT) console.log("Hooks.on token.js refreshToken");
}


// Hooks.on("deleteToken")
function handleDeleteToken(token) {
  updateTokenVisuals(token);
}














// ----------------- Token Configuration -----------------

// Ajusta a precisão de configurações de token no Foundry VTT
export class TokenPrecisionConfig {
  // Ajusta o incremento de Scale (Ratio) para 0.01
  static adjustScaleRatio() {
    const scaleInput = document.querySelector('input[name="scale"]');
    if (scaleInput) {
      scaleInput.step = '0.01';
      scaleInput.min = '0.1';
      //console.log('Scale input adjusted', scaleInput);
    } else {
      console.warn('Scale input not found');
    }
  }

  // Ajusta o incremento de Anchor para 0.01
  static adjustAnchorIncrement() {
    // Seletores específicos para os inputs de anchor na aba Appearance
    const anchorInputSelectors = ['input[name="texture.anchorX"]', 'input[name="texture.anchorY"]'];

    let foundInputs = false;

    anchorInputSelectors.forEach(selector => {
      const inputs = document.querySelectorAll(selector);
      
      if (inputs.length > 0) {
        //console.log(`Found inputs for selector: ${selector}`, inputs);
        inputs.forEach(input => {
          input.step = '0.01';
          input.min = '0';
          input.max = '1';
        });
        foundInputs = true;
      }
    });

    if (!foundInputs) {
      console.warn('No texture anchor inputs found. Token configuration might have different selectors.');
      
      // Log all inputs in the token config for debugging
      //const allInputs = document.querySelectorAll('input');
      //console.log('All inputs in the document:', allInputs);
    }
  }

  // Método principal para inicializar todas as configurações de precisão
  static initialize() {
    // Aguarda um breve momento para garantir que o DOM esteja carregado
    Hooks.on('renderTokenConfig', (tokenConfig, html, data) => {
      //console.log('Token Config Rendered', {tokenConfig, html, data});
      
      // Pequeno delay para garantir que todos os elementos estejam prontos
      setTimeout(() => {
        this.adjustScaleRatio();
        this.adjustAnchorIncrement();
      }, 100);
    });
  }
}

// Inicializa as configurações de precisão ao carregar o módulo
TokenPrecisionConfig.initialize();




// Módulo para melhorar a interação com inputs de anchor no Foundry VTT
export class EnhancedAnchorInput {
  // Cria botões de controle e configura listeners para ajuste refinado
  static enhanceAnchorInputs(inputs) {
    // Contêiner principal para envolver os inputs e botão
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '5px';

    // Adiciona os inputs e botão
    let anchorXInput = inputs[0].cloneNode(true);
    let anchorYInput = inputs[1].cloneNode(true);

    // Configura inputs clonados
    anchorXInput.style.flexGrow = '1';
    anchorYInput.style.flexGrow = '1';
    anchorXInput.removeAttribute('min');
    anchorXInput.removeAttribute('max');
    anchorYInput.removeAttribute('min');
    anchorYInput.removeAttribute('max');

    // Criar botão de ajuste fino com ícone de 4 direções
    const adjustButton = document.createElement('button');
    adjustButton.innerHTML = '✥'; // Ícone de movimento 4 direções
    adjustButton.type = 'button';
    adjustButton.style.cursor = 'pointer';
    adjustButton.style.padding = '2px 5px';
    adjustButton.style.border = '1px solid #888';
    adjustButton.style.borderRadius = '3px';
    adjustButton.title = 'Hold and drag to fine-tune X and Y';

    // Estado do ajuste
    let isAdjusting = false;
    let startX = 0;
    let startY = 0;
    let originalValueX = 0;
    let originalValueY = 0;

    // Função para aplicar ajuste
    const applyAdjustment = (e) => {
      if (!isAdjusting) return;

      // Calcula a diferença de movimento nos eixos X e Y
      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;
      
      // Ajuste fino: cada 10px de movimento = 0.01 de valor
      const adjustmentX = deltaX * 0.001;
      const adjustmentY = deltaY * 0.001;
      
      // Calcula novos valores
      let newValueX = originalValueX + adjustmentX;
      let newValueY = originalValueY + adjustmentY;
      
      // Arredonda para 2 casas decimais
      newValueX = Math.round(newValueX * 100) / 100;
      newValueY = Math.round(newValueY * 100) / 100;
      
      // Atualiza os inputs de anchor
      const actualXInput = document.querySelector('input[name="texture.anchorX"]');
      const actualYInput = document.querySelector('input[name="texture.anchorY"]');

      if (actualXInput) {
        actualXInput.value = newValueX.toFixed(2);
        actualXInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (actualYInput) {
        actualYInput.value = newValueY.toFixed(2);
        actualYInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // Listeners para ajuste
    adjustButton.addEventListener('mousedown', (e) => {
      isAdjusting = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Obtém os valores originais dos inputs de anchor
      const actualXInput = document.querySelector('input[name="texture.anchorX"]');
      const actualYInput = document.querySelector('input[name="texture.anchorY"]');
      
      originalValueX = actualXInput ? parseFloat(actualXInput.value) : 0;
      originalValueY = actualYInput ? parseFloat(actualYInput.value) : 0;
      
      // Adiciona listeners globais
      document.addEventListener('mousemove', applyAdjustment);
      document.addEventListener('mouseup', () => {
        isAdjusting = false;
        document.removeEventListener('mousemove', applyAdjustment);
      });
      
      e.preventDefault();
    });

    /*// Adiciona tooltip explicativo
    adjustButton.addEventListener('mouseenter', () => {
      const tooltip = document.createElement('div');
      tooltip.textContent = 'Hold and drag to fine-tune X and Y';
      tooltip.style.position = 'absolute';
      tooltip.style.background = '#333';
      tooltip.style.color = 'white';
      tooltip.style.padding = '5px';
      tooltip.style.borderRadius = '3px';
      tooltip.style.fontSize = '12px';
      tooltip.style.zIndex = '1000';
      tooltip.style.pointerEvents = 'none';
      
      // Posiciona o tooltip
      const rect = adjustButton.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left}px`;
      
      document.body.appendChild(tooltip);
      
      adjustButton.addEventListener('mouseleave', () => {
        document.body.removeChild(tooltip);
      }, { once: true });
    });*/

    // Adiciona os elementos ao wrapper na ordem: X input, botão, Y input
    wrapper.appendChild(anchorXInput);
    wrapper.appendChild(adjustButton);
    wrapper.appendChild(anchorYInput);

    // Substitui os inputs originais
    const parentContainer = inputs[0].parentNode;
    parentContainer.replaceChild(wrapper, inputs[0]);
    parentContainer.removeChild(inputs[1]);
  }

  // Inicializa a melhoria dos inputs de anchor
  static initialize() {
    Hooks.on('renderTokenConfig', () => {
      setTimeout(() => {
        const anchorXInput = document.querySelector('input[name="texture.anchorX"]');
        const anchorYInput = document.querySelector('input[name="texture.anchorY"]');

        if (anchorXInput && anchorYInput) {
          this.enhanceAnchorInputs([anchorXInput, anchorYInput]);
        }
      }, 100);
    });
  }
}

// Inicializa o módulo de melhoria de inputs
EnhancedAnchorInput.initialize();