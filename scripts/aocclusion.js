// === Função para verificar se um ponto está abaixo de uma linha ===
export function isPointBelowLine(lineStart, lineEnd, point) {
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const [px, py] = point;

  // Calcula o produto vetorial
  const cross = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);

  return cross > 0;
}

// === Função para obter o centro de um tile ===
export function getTileCenter(tile) {
  return {
      x: tile.x + (tile.width * canvas.grid.size) / 2,
      y: tile.y + (tile.height * canvas.grid.size) / 2
  };
}

// === Função principal para atualizar a visibilidade dos tiles ===
export function updateTileVisibility() {
  console.log("teste");
  // Obtém os tokens controlados (selecionados) pelo usuário
  const controlledTokens = canvas.tokens.controlled;

  if (controlledTokens.length === 0) {
      // Nenhum token selecionado; opcionalmente, pode definir uma visibilidade padrão
      return;
  }

  const selectedToken = controlledTokens[0]; // Assume seleção única

  // Calcula o ponto central do token
  const tokenCenter = {
      x: selectedToken.x + (selectedToken.width * canvas.grid.size) / 2,
      y: selectedToken.y + (selectedToken.height * canvas.grid.size) / 2
  };

  // Itera sobre todos os tiles no canvas
  canvas.tiles.placeables.forEach(tile => {
      // Obtém o centro do tile
      const tileCenter = getTileCenter(tile);

      const w = tile.width * canvas.grid.size;
      const h = tile.height * canvas.grid.size;

      // Define os vértices do tile
      const east = [tileCenter.x + w / 2, tileCenter.y + h / 2];
      const west = [tileCenter.x - w / 2, tileCenter.y + h / 2];
      const south = [tileCenter.x, tileCenter.y + h];

      // Verifica se o token está abaixo das linhas leste-sul ou oeste-sul
      const isBelowEastSouth = isPointBelowLine(east, south, [tokenCenter.x, tokenCenter.y]);
      const isBelowWestSouth = isPointBelowLine(west, south, [tokenCenter.x, tokenCenter.y]);

      if (isBelowEastSouth || isBelowWestSouth) {
          // Torna o tile visível
          tile.alpha = 1.0;
      } else {
          // Torna o tile invisível
          tile.alpha = 0.0;
      }
  });
}

export function registerOcclusionConfig() {

  // === Hooks para monitorar seleção e movimentação de tokens ===

  // Quando um token é controlado (selecionado ou deselecionado)
  Hooks.on('controlToken', (token, controlled) => {
    updateTileVisibility();
  });

  // Quando um token é atualizado (movido, por exemplo)
  Hooks.on('updateToken', (scene, tokenData, updates, options, userId) => {
    updateTileVisibility();
  });

  // Quando um token é criado
  Hooks.on('createToken', (scene, token, options, userId) => {
    updateTileVisibility();
  });

  // Quando um token é deletado
  Hooks.on('deleteToken', (scene, token, options, userId) => {
    updateTileVisibility();
  });

  // === Hooks adicionais para monitorar alterações nos tiles ===

  // Quando um tile é criado
  Hooks.on('createTile', (scene, tile, options, userId) => {
    updateTileVisibility();
  });

  // Quando um tile é atualizado
  Hooks.on('updateTile', (scene, tileData, updates, options, userId) => {
    updateTileVisibility();
  });

  // Quando um tile é deletado
  Hooks.on('deleteTile', (scene, tile, options, userId) => {
    updateTileVisibility();
  });

  // === Atualiza a visibilidade ao carregar o canvas pela primeira vez ===
  Hooks.on('ready', () => {
    updateTileVisibility();
  });

}