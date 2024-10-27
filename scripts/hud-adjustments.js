import { MODULE_ID } from './settings.js';
import { calculateIsometricPosition } from './utils.js';

/**
 Ajusta a posição do HUD do token para o modo isométrico.
  @param {TokenHUD} hud - O HUD do token a ser ajustado.
  @param {jQuery} html - O elemento HTML do HUD.
**/
function adjustHUDPosition(hud, html) {
  const token = hud.object;
  const { width, height } = token;
  const { x, y } = token.position;

  const topCenter = calculateIsometricPosition(x + (width / 2), y);
  const offsetY = height * Math.sin(Math.PI / 6);

  html.css({
    left: `${topCenter.x + (height * 0.3)}px`,
    top: `${topCenter.y - offsetY + (width * 1.33)}px`,
    transform: 'translate(-50%, -100%)'
  });
}

// Hook para ajustar a posição do TokenHUD quando ele é renderizado.
Hooks.on("renderTokenHUD", (hud, html, data) => {
  const scene = game.scenes.current;
  const isIsometric = scene.getFlag(MODULE_ID, "isometricEnabled");
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");

  if (isometricWorldEnabled && isIsometric) {
    requestAnimationFrame(() => adjustHUDPosition(hud, html));
  }
});

export { adjustHUDPosition };
