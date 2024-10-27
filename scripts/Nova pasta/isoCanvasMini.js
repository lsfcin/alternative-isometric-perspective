const MODULE_ID = "isometric-perspective";

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
    onChange: settings => window.location.reload()
    //requiresReload: true, // true if you want to prompt the user to reload
  });
});

// -------- RENDER TEMPLATES -------------------------------------------------------------------------------------------------------
// Hook para adicionar a nova aba de configurações à cena
Hooks.on("renderSceneConfig", async (sceneConfig, html, data) => {
  // Renderiza o template HTML
  const tabHtml = await renderTemplate("modules/isometric-perspective/templates/scene-config.html");
  
  // Adiciona o botão e o conteúdo da aba logo após a última aba
  html.find('nav.sheet-tabs:not(.secondary-tabs)').append('<a class="item" data-tab="isometric"><i class="fas fa-cube"></i> Isometric</a>');
  html.find('div.tab[data-tab="ambience"]').after(tabHtml);

  // Inicializa os valores dos controles
  const isoCheckbox = html.find('input[name="flags.isometric-perspective.isometricEnabled"]');
  const bgCheckbox = html.find('input[name="flags.isometric-perspective.isometricBackground"]');
  const scaleSlider = html.find('input[name="flags.isometric-perspective.isometricScale"]');
  const scaleDisplay = html.find('.range-value');
  
  // Define os valores iniciais
  isoCheckbox.prop("checked", sceneConfig.object.getFlag(MODULE_ID, "isometricEnabled"));
  bgCheckbox.prop("checked", sceneConfig.object.getFlag(MODULE_ID, "isometricBackground"));
  
  // Inicializa o valor do slider
  const currentScale = sceneConfig.object.getFlag(MODULE_ID, "isometricScale") ?? 1;
  scaleSlider.val(currentScale);
  scaleDisplay.text(currentScale);

  // Atualiza apenas o display do valor quando o slider é movido
  scaleSlider.on('input', function() {
    scaleDisplay.text(this.value);
  });
  
  // Handler para o formulário de submit
  html.find('form').on('submit', async (event) => {
    // Coleta os valores atuais dos controles
    const newIsometric = isoCheckbox.prop("checked");
    const newBackground = bgCheckbox.prop("checked");
    const newScale = parseFloat(scaleSlider.val());
    
    // Atualiza as flags com os novos valores
    if (newIsometric) {
      await sceneConfig.object.setFlag(MODULE_ID, "isometricEnabled", true);
    } else {
      await sceneConfig.object.unsetFlag(MODULE_ID, "isometricEnabled");
    }

    if (newBackground) {
      await sceneConfig.object.setFlag(MODULE_ID, "isometricBackground", true);
    } else {
      await sceneConfig.object.unsetFlag(MODULE_ID, "isometricBackground");
    }

    await sceneConfig.object.setFlag(MODULE_ID, "isometricScale", newScale);

    // Se a cena sendo editada for a atual, aplica as transformações
    if (canvas.scene.id === sceneConfig.object.id) {
      requestAnimationFrame(() => {
        applyIsometricPerspective(sceneConfig.object, newIsometric);
        applyBackgroundTransformation(sceneConfig.object, newIsometric, newBackground);
      });
    }
  });
});



// -------- HOOKS ------------------------------------------------------------------------------------------------------------------
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

// Adicione um hook para atualizar background, tokens e tiles quando a cena for modificada
Hooks.on("updateScene", (scene, changes) => {
  if (changes.img || 
    changes.background?.offsetX !== undefined || 
    changes.background?.offsetY !== undefined ||
    changes.flags?.[MODULE_ID]?.isometricEnabled !== undefined ||
    changes.flags?.[MODULE_ID]?.isometricBackground !== undefined ||
    changes.grid !== undefined ||          // Verifica mudanças na grid
    changes.gridType !== undefined ||      // Verifica mudanças no tipo de grid
    changes.gridSize !== undefined) {      // Verifica mudanças no tamanho da grid
    
    const isIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
    const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;
    
    requestAnimationFrame(() => {
      applyIsometricPerspective(scene, isIsometric);
      applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
    });
  }
});








// -------- FUNÇÕES AUXILIARES -----------------------------------------------------------------------------------------------------
// Função auxiliar para converter coordenadas isométricas para cartesianas
function isoToCartesian(isoX, isoY) {
  const angle = Math.PI / 4; // 45 graus em radianos
  return {
    x: (isoX * Math.cos(angle) - isoY * Math.sin(angle)),
    y: (isoX * Math.sin(angle) + isoY * Math.cos(angle))
  };
}

// Função auxiliar para converter coordenadas cartesianas para isométricas
function cartesianToIso(cartX, cartY) {
  const angle = Math.PI / 4; // 45 graus em radianos
  return {
    x: (cartX * Math.cos(-angle) - cartY * Math.sin(-angle)),
    y: (cartX * Math.sin(-angle) + cartY * Math.cos(-angle))
  };
}

// Função auxiliar para calcular a menor diagonal do losango (distância vertical entre vértices)
function calculateIsometricVerticalDistance(width, height) {
  // Em uma projeção isométrica com rotação de 45°, a distância vertical
  // entre os vértices é a altura do losango formado
  return Math.sqrt(2) * Math.min(width, height);
}














// -------- FUNÇÕES TRANSFORMAÇÃO ISOMÉTRICA ---------------------------------------------------------------------------------------
// Função principal que muda o canvas da cena
function applyIsometricPerspective(scene, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const isoAngle = Math.PI/6;
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
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
function adjustAllTokensAndTilesForIsometric() {
  canvas.tokens.placeables.forEach(token => applyIsometricTransformation(token, true));
  canvas.tiles.placeables.forEach(tile => applyIsometricTransformation(tile, true));
}

// Função auxiliar que chama a função de transformação isométrica em um objeto específico da cena (token ou tile)
function applyTokenTransformation(token, isIsometric) {
  applyIsometricTransformation(token, isIsometric);
}

// Função que aplica a transformação isométrica para um token ou tile -------------------------------------------------
function applyIsometricTransformation(object, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  
  if (!object.mesh) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Mesh não encontrado:", object);
    }
    return;
  }

  if (isometricWorldEnabled && isIsometric) {
    // desfaz rotação e deformação
    object.mesh.rotation = Math.PI/4;
    object.mesh.skew.set(0, 0);
    
    // recupera as características de dimensões do objeto (token/tile)
    let texture = object.texture;
    let originalWidth = texture.width;   // art width
    let originalHeight = texture.height; // art height
    let scaleX = object.document.width;  // scale for 2x2, 3x3 tokens
    let scaleY = object.document.height; // scale for 2x2, 3x3 tokens
    let isoScale = object.document.getFlag(MODULE_ID, 'scale') ?? 1;
    
    // Se o objeto for um Token
    if (object instanceof Token) {
      // orienta a arte para ser gerada sempre do vertice esquerdo
      object.mesh.anchor.set(0, 1);
      
      object.mesh.scale.set(
        scaleX * isoScale,
        scaleY * isoScale * Math.sqrt(3)
      );
      
      // define o offset manual para centralizar o token
      const offsetX = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;
      const offsetY = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      const isoOffsets = cartesianToIso(offsetX, offsetY);
      
      // posiciona o token
      object.mesh.position.set(
        object.document.x + isoOffsets.x,
        object.document.y + isoOffsets.y
      );
    }

    // Se o objeto for um Tile
    else if (object instanceof Tile) {
      // Aplicar a escala mantendo a proporção da arte original
      object.mesh.scale.set(
        isoScale,
        isoScale * Math.sqrt(3)
      );
      
      // Aplicar a posição base do tile
      object.mesh.position.set(
        object.document.x + (originalWidth / 2),
        object.document.y + (originalHeight / 2)
      );
    }
  } else {
    // Reseta todas as transformações do mesh
    object.mesh.rotation = 0;
    object.mesh.skew.set(0, 0);
    object.mesh.scale.set(1, 1);
    object.mesh.position.set(object.document.x, object.document.y);
  }
}

// Função para transformar o background da cena -----------------------------------------------------------------------
function applyBackgroundTransformation(scene, isIsometric, shouldTransform) {
  if (!canvas?.primary?.background) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Background não encontrado");
    }
    return;
  }

  const background = canvas.environment.primary.background;
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isIsometric && shouldTransform) {
    // Aplica rotação isométrica
    background.rotation = Math.PI/4;
    background.skew.set(0, 0);
    background.anchor.set(0.5, 0.5);
    background.transform.scale.set(
      2* scale,
      2* scale * Math.sqrt(3)
    );
    
    // Calculate scene dimensions and padding
    const s = canvas.scene;
    //console.log(s);
    const padding = s.padding;
    const paddingX = s.width * padding;
    const paddingY = s.height * padding;
      
    // Account for background offset settings
    const offsetX = s.background.offsetX || 0;
    const offsetY = s.background.offsetY || 0;
    
    // Set position considering padding and offset
    background.position.set(
      (s.width / 2) + paddingX + offsetX,
      (s.height / 2) + paddingY + offsetY
    );

  } else {
    // Reset transformações
    background.rotation = 0;
    background.skew.set(0, 0);
   
    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("applyBackgroundTransformation RESET");
    }
  }
}