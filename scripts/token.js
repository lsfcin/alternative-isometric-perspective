import { MODULE_ID, DEBUG_PRINT, WORLD_ISO_FLAG } from './main.js';
import { applyIsometricTransformation, updateTokenVisuals } from './transform.js';
import { cartesianToIso, isoToCartesian } from './utils.js';

export function registerTokenConfig() {
  Hooks.on("renderTokenConfig", handleRenderTokenConfig);

  Hooks.on("createToken", handleCreateToken);
  Hooks.on("updateToken", handleUpdateToken);
  Hooks.on("refreshToken", handleRefreshToken);
  Hooks.on("deleteToken", handleDeleteToken);
}


async function handleRenderTokenConfig(app, html, data) {
  // Load the HTML template
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/token-config.html", {
    isoDisabled: app.object.getFlag(MODULE_ID, 'isoTokenDisabled') ?? 1,
    offsetX: app.object.getFlag(MODULE_ID, 'offsetX') ?? 0,
    offsetY: app.object.getFlag(MODULE_ID, 'offsetY') ?? 0,
    isoAnchorY: app.object.getFlag(MODULE_ID, 'isoAnchorY') ?? 0,
    isoAnchorX: app.object.getFlag(MODULE_ID, 'isoAnchorX') ?? 0,
    isoAnchorToggleCheckbox: app.object.getFlag(MODULE_ID, 'isoAnchorToggle') ?? 0,
    scale: app.object.getFlag(MODULE_ID, 'scale') ?? 1
  });
  
  // Add a new tab to the menu
  const tabs = html.find('.tabs:not(.secondary-tabs)');
  tabs.append(`<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> ${game.i18n.localize('isometric-perspective.tab_isometric_name')}</a>`);
  
  // Adds the tab contents after the last existing tab
  const lastTab = html.find('.tab').last();
  lastTab.after(tabHtml);

  // Update the offset fine adjustment button
  updateAdjustOffsetButton(html);
  updateAdjustAnchorButton(html);

  // Initializes control values
  const isoTokenCheckbox = html.find('input[name="flags.isometric-perspective.isoTokenDisabled"]');
  isoTokenCheckbox.prop("checked", app.object.getFlag(MODULE_ID, "isoTokenDisabled"));

  // Add listener to update the shown value from Slider
  html.find('.scale-slider').on('input', function() {
    html.find('.range-value').text(this.value);
  });

  // Handler for the submit form
  html.find('form').on('submit', async (event) => {
    // If the value of checkbox is true, updates the flags with the new values
    if (isoTokenCheckbox.prop("checked")) {
      await app.object.setFlag(MODULE_ID, "isoTokenDisabled", true);
    } else {
      await app.object.unsetFlag(MODULE_ID, "isoTokenDisabled");
    }
  });

  // Fix tab init
  if (!app._tabs || app._tabs.length === 0) {
    app._tabs = [new Tabs({
      navSelector: ".tabs",
      contentSelector: ".sheet-body",
      initial: "appearance",
      callback: () => {}
    })];
    app._tabs[0].bind(html[0]);
  }






  // Initializes control values
  const isoAnchorToggleCheckbox = html.find('input[name="flags.isometric-perspective.isoAnchorToggle"]');
  isoAnchorToggleCheckbox.prop("unchecked", app.object.getFlag(MODULE_ID, "isoAnchorToggle") ?? false);

  // Function to draw alignment lines
  function drawAlignmentLines(isoAnchor) {
    // Removes existing lines
    cleanup();
    
    // Create container for the lines
    const graphics = new PIXI.Graphics();
    graphics.name = 'tokenAlignmentLine';
    graphics.lineStyle(1, 0xFF0000, 0.75); // Largura, Cor, Opacidade

    // Calculate diagonal length
    const canvasWidth = canvas.dimensions.width;
    const canvasHeight = canvas.dimensions.height;
    const diagonalLength = Math.sqrt(Math.pow(canvasWidth, 2) + Math.pow(canvasHeight, 2));

    // Draw lines
    graphics.moveTo(isoAnchor.x - diagonalLength / 2, isoAnchor.y - diagonalLength / 2);
    graphics.lineTo(isoAnchor.x + diagonalLength / 2, isoAnchor.y + diagonalLength / 2);
    
    graphics.moveTo(isoAnchor.x - diagonalLength / 2, isoAnchor.y + diagonalLength / 2);
    graphics.lineTo(isoAnchor.x + diagonalLength / 2, isoAnchor.y - diagonalLength / 2);

    // Add on canvas
    canvas.stage.addChild(graphics);
    return graphics;
  };

  // Function to calculate the alignment point
  function updateIsoAnchor(isoAnchorX, isoAnchorY, offsetX, offsetY) {
    let tokenMesh = app.token.object.mesh;
    if (!tokenMesh) return { x: 0, y: 0 };
    
    // Defines the values ​​and transforms strings into numbers
    let textureValues = cartesianToIso(
      tokenMesh.height,
      tokenMesh.width
    );
    let isoAnchors = cartesianToIso(
      parseFloat(isoAnchorX) * tokenMesh.height,
      parseFloat(isoAnchorY) * tokenMesh.width
    );
    let isoOffsets = cartesianToIso(
      parseFloat(offsetX), 
      parseFloat(offsetY)
    );

    return {
      x: (tokenMesh.x - textureValues.x/2) + isoOffsets.x + isoAnchors.x,
      y: (tokenMesh.y - textureValues.y/2) + isoOffsets.y + isoAnchors.y
    };
  };

  

  // Function to remove the lines
  function cleanup() {
    const existingLines = canvas.stage.children.filter(child => child.name === 'tokenAlignmentLine');
    existingLines.forEach(line => line.destroy());
  };

  
  // Initialize the lines with the current values
  let isoAnchorX = app.object.getFlag(MODULE_ID, 'isoAnchorX') ?? 0;
  let isoAnchorY = app.object.getFlag(MODULE_ID, 'isoAnchorY') ?? 0;
  let offsetX = app.object.getFlag(MODULE_ID, 'offsetX') ?? 0;
  let offsetY = app.object.getFlag(MODULE_ID, 'offsetY') ?? 0;
  
  // Add the button to reset the token settings
  const toggleButton = document.createElement("button");
  toggleButton.classList.add("toggle-alignment-lines");
  toggleButton.textContent = "Reset Token Alignment Configuration";
  toggleButton.title = "Click to toggle the alignment lines";
  html.find(".anchor-point").append(toggleButton);

  // Variables to control state
  let graphics;
  let showAlignmentLines = true;
  
  // Add the click event to the button
  toggleButton.addEventListener("click", async (event) => {
    event.preventDefault(); // Evita que o clique feche a janela

    // Reset all alignment settings
    html.find('input[name="texture.anchorX"]').val(0.5);
    html.find('input[name="texture.anchorY"]').val(0.5);
    html.find('input[name="flags.isometric-perspective.isoAnchorX"]').val(0.5);
    html.find('input[name="flags.isometric-perspective.isoAnchorY"]').val(0.5);
    html.find('input[name="flags.isometric-perspective.offsetX"]').val(0);
    html.find('input[name="flags.isometric-perspective.offsetY"]').val(0);
    html.find('input[name="flags.isometric-perspective.scale"]').val(1);

    graphics = drawAlignmentLines(updateIsoAnchor(isoAnchorX, isoAnchorY, offsetX, offsetY));
  });
  

  // Add a listener to the "Save?" Checkbox, If it is marked, draw the lines
  isoAnchorToggleCheckbox.on('change', async () => {
    const isChecked = isoAnchorToggleCheckbox.prop("checked");
    if (isChecked) graphics = drawAlignmentLines(updateIsoAnchor(isoAnchorX, isoAnchorY, offsetX, offsetY));
    
    // Invert the state of the selector
    showAlignmentLines = !showAlignmentLines;
  });
  
  // Update the lines when changing the inputs
  html.find('input[name="flags.isometric-perspective.isoAnchorX"], input[name="flags.isometric-perspective.isoAnchorY"], input[name="flags.isometric-perspective.offsetX"], input[name="flags.isometric-perspective.offsetY"]').on('change', () => {
    // Take updated values ​​directly from inputs
    let currentIsoAnchorX = html.find('input[name="flags.isometric-perspective.isoAnchorX"]').val();
    let currentIsoAnchorY = html.find('input[name="flags.isometric-perspective.isoAnchorY"]').val();
    let currentOffsetX = html.find('input[name="flags.isometric-perspective.offsetX"]').val();
    let currentOffsetY = html.find('input[name="flags.isometric-perspective.offsetY"]').val();
    
    // Recalculate the position and creates the lines again
    const newAnchor = updateIsoAnchor(currentIsoAnchorX, currentIsoAnchorY, currentOffsetX, currentOffsetY);
    graphics = drawAlignmentLines(newAnchor); // Adicionar novas
  });

  
  
  


  // Removes all lines when clicking on update token
  html.find('button[type="submit"]').on('click', () => {
    if (!isoAnchorToggleCheckbox.prop("checked")) {
      cleanup();
    } else {
      // Update the anchor basic values ​​in the token configuration
      html.find('input[name="texture.anchorX"]').val(isoAnchorY);
      html.find('input[name="texture.anchorY"]').val(1-isoAnchorX);
    }
  });

  // Changes the Close method to delete the lines, IF avoids changing the method more than once
  if (!app._isCloseModified) {
    const originalClose = app.close;
    app.close = async function (options) {
      cleanup();
      await originalClose.apply(this, [options]);
    };

    // Mark that the close method has already been
    app._isCloseModified = true;
  }
}




// Hooks.on("createToken")
function handleCreateToken(tokenDocument) {
  const token = canvas.tokens.get(tokenDocument.id);
  if (!token) return;
  
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(token, isSceneIsometric);
}


// Hooks.on("updateToken")
function handleUpdateToken(tokenDocument, updateData, options, userId) {
  const token = canvas.tokens.get(tokenDocument.id);
  if (!token) return;
  
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(token, isSceneIsometric);
  
  /*if (updateData.flags?.[MODULE_ID] ||
      updateData.x !== undefined ||
      updateData.y !== undefined ) {
        applyIsometricTransformation(token, isSceneIsometric);
  }*/

  if (DEBUG_PRINT) console.log("Hooks.on token.js updateToken");
}


// Hooks.on("refreshToken")
function handleRefreshToken(token) {
  const isSceneIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(token, isSceneIsometric);
  
  if (DEBUG_PRINT) console.log("Hooks.on token.js refreshToken");
}


// Hooks.on("deleteToken")
function handleDeleteToken(token) {
  updateTokenVisuals(token);
}












function updateAdjustOffsetButton(html) {
  const offsetPointContainer = html.find('.offset-point')[0];

  // Finds the fine adjustment button on the original HTML
  const adjustButton = offsetPointContainer.querySelector('button.fine-adjust');

  // Configures the fine adjustment button
  adjustButton.style.width = '30px';
  adjustButton.style.cursor = 'pointer';
  adjustButton.style.padding = '1px 5px';
  adjustButton.style.border = '1px solid #888';
  adjustButton.style.borderRadius = '3px';
  //adjustButton.title = 'Hold and drag to fine-tune X and Y';
  adjustButton.title = game.i18n.localize('isometric-perspective.token_artOffset_mouseover');

  // Adds the fine adjustment logic
  let isAdjusting = false;
  let startX = 0;
  let startY = 0;
  let originalValueX = 0;
  let originalValueY = 0;

  let offsetXInput = html.find('input[name="flags.isometric-perspective.offsetX"]')[0];
  let offsetYInput = html.find('input[name="flags.isometric-perspective.offsetY"]')[0];

  // Function to apply adjustment
  const applyAdjustment = (e) => {
    if (!isAdjusting) return;

    // Calculates the difference on x and y axes
    const deltaY = e.clientX - startX;
    const deltaX = startY - e.clientY;
    
    // Fine tuning: every 10px of motion = 0.1 value 
    const adjustmentX = deltaX * 0.2;
    const adjustmentY = deltaY * 0.2;
    
    // Calculates new values
    let newValueX = Math.round(originalValueX + adjustmentX);
    let newValueY = Math.round(originalValueY + adjustmentY);
    
    // Rounding for 2 decimal places
    newValueX = Math.round(newValueX * 100) / 100;
    newValueY = Math.round(newValueY * 100) / 100;
    
    // Updates anchor inputs
    offsetXInput.value = newValueX.toFixed(0);
    offsetYInput.value = newValueY.toFixed(0);
    offsetXInput.dispatchEvent(new Event('change', { bubbles: true }));
    offsetYInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Listeners for Adjustment
  adjustButton.addEventListener('mousedown', (e) => {
    isAdjusting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Obtains the original values ​​of offset inputs
    originalValueX = parseFloat(offsetXInput.value);
    originalValueY = parseFloat(offsetYInput.value);
    
    // Add global listeners
    document.addEventListener('mousemove', applyAdjustment);
    document.addEventListener('mouseup', () => {
      isAdjusting = false;
      document.removeEventListener('mousemove', applyAdjustment);
    });
    
    e.preventDefault();
  });
}





function updateAdjustAnchorButton(html) {
  const offsetPointContainer = html.find('.anchor-point')[0];

  // Finds the fine adjustment button on the original HTML
  const adjustButton = offsetPointContainer.querySelector('button.fine-adjust-anchor');

  // Configures the fine adjustment button
  adjustButton.style.width = '30px';
  adjustButton.style.cursor = 'pointer';
  adjustButton.style.padding = '1px 5px';
  adjustButton.style.border = '1px solid #888';
  adjustButton.style.borderRadius = '3px';
  adjustButton.title = 'Hold and drag to fine-tune X and Y';

  // Adds the fine adjustment logic
  let isAdjusting = false;
  let startX = 0;
  let startY = 0;
  let originalValueX = 0;
  let originalValueY = 0;

  let anchorXInput = html.find('input[name="flags.isometric-perspective.isoAnchorX"]')[0];
  let anchorYInput = html.find('input[name="flags.isometric-perspective.isoAnchorY"]')[0];

  // Function to apply adjustment
  const applyAdjustment = (e) => {
    if (!isAdjusting) return;

    // Calculates the difference on x and y axes
    const deltaY = e.clientX - startX;
    const deltaX = startY - e.clientY;
    
    // Fine tuning: every 10px of motion = 0.01 value 
    const adjustmentX = deltaX * 0.005;
    const adjustmentY = deltaY * 0.005;
    
    // Calculates new values
    //let newValueX = Math.round(originalValueX + adjustmentX);
    //let newValueY = Math.round(originalValueY + adjustmentY);
    let newValueX = Math.max(0, Math.min(1, originalValueX + adjustmentX));
    let newValueY = Math.max(0, Math.min(1, originalValueY + adjustmentY));
    
    // Rounding for 2 decimal places
    newValueX = Math.round(newValueX * 100) / 100;
    newValueY = Math.round(newValueY * 100) / 100;
    
    // Updates anchor inputs
    anchorXInput.value = newValueX.toFixed(2);
    anchorYInput.value = newValueY.toFixed(2);
    anchorXInput.dispatchEvent(new Event('change', { bubbles: true }));
    anchorYInput.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Listeners for Adjustment
  adjustButton.addEventListener('mousedown', (e) => {
    isAdjusting = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Obtains the original values ​​of offset inputs
    originalValueX = parseFloat(anchorXInput.value);
    originalValueY = parseFloat(anchorYInput.value);
    
    // Add global listeners
    document.addEventListener('mousemove', applyAdjustment);
    document.addEventListener('mouseup', () => {
      isAdjusting = false;
      document.removeEventListener('mousemove', applyAdjustment);
    });
    
    e.preventDefault();
  });
}



















/*
// ----------------- Enhanced Token Configuration -----------------
// --- TokenPrecisionConfig adjust the scale (ratio) to has step of 0.01 instead of 0.1,
// --- and EnhancedAnchorInput adjust the anchor X and Y to has steps of 0.01 instead of 1

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
*/

/*
export class EnhancedAnchorInput {
  // Cria botões de controle e configura listeners para ajuste refinado
  static enhanceAnchorInputs(inputs) {
    // Verifica se o wrapper já existe
    let wrapper = inputs[0].parentNode;
    if (wrapper.classList.contains('enhanced-anchor-wrapper')) {
      // Se existir, remove o wrapper e seus filhos
      wrapper.parentNode.replaceChild(inputs[0], wrapper);
      wrapper.parentNode.replaceChild(inputs[1], wrapper.lastElementChild);
    }
    
    // Contêiner principal para envolver os inputs e botão
    wrapper = document.createElement('div');
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
*/

