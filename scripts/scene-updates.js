import { MODULE_ID } from './settings.js';
import { applyIsometricPerspective, applyBackgroundTransformation, applyIsometricTransformation } from './transforms.js';

// Hook para aplicar a perspectiva isométrica quando o canvas estiver pronto.
Hooks.on("canvasReady", (canvas) => {
  const activeScene = game.scenes.active;
  if (!activeScene) return;

  const isIsometric = activeScene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = activeScene.getFlag(MODULE_ID, "isometricBackground") ?? false;

  applyIsometricPerspective(activeScene, isIsometric);
  applyBackgroundTransformation(activeScene, isIsometric, shouldTransformBackground);
});

// Hook para redimensionar o background quando o canvas for redimensionado.
Hooks.on("canvasResize", (canvas) => {
  const scene = canvas.scene;
  if (!scene) return;

  const isIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const shouldTransformBackground = scene.getFlag(MODULE_ID, "isometricBackground") ?? false;

  if (isIsometric && shouldTransformBackground) {
    applyBackgroundTransformation(scene, isIsometric, shouldTransformBackground);
  }
});

// Outros hooks para tokens e tiles
Hooks.on("createToken", (tokenDocument) => {
  const token = canvas.tokens.get(tokenDocument.id);
  if (token) applyIsometricTransformation(token, true);
});

Hooks.on("updateToken", (tokenDocument, updateData, options, userId) => {
  const token = canvas.tokens.get(tokenDocument.id);
  if (token) applyIsometricTransformation(token, true);
});

Hooks.on("refreshToken", (token) => {
  const isIsometric = token.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(token, isIsometric);
});

Hooks.on("createTile", (tileDocument) => {
  const tile = canvas.tiles.get(tileDocument.id);
  if (tile) applyIsometricTransformation(tile, true);
});

Hooks.on("updateTile", (tileDocument, updateData, options, userId) => {
  const tile = canvas.tiles.get(tileDocument.id);
  if (tile) applyIsometricTransformation(tile, true);
});

Hooks.on("refreshTile", (tile) => {
  const isIsometric = tile.scene.getFlag(MODULE_ID, "isometricEnabled");
  applyIsometricTransformation(tile, isIsometric);
});
