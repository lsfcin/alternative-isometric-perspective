import { MODULE_ID } from './settings.js';
import { isoToCartesian, cartesianToIso } from './utils.js';
export { applyIsometricPerspective, applyBackgroundTransformation, applyIsometricTransformation };

/**
 * Aplica a perspectiva isométrica ao canvas de uma cena.
 * Ajusta a rotação do canvas e aplica a transformação aos tokens e tiles.
 * 
 * @param {Scene} scene - A cena para aplicar a transformação.
 * @param {boolean} isIsometric - Indica se o modo isométrico está habilitado.
 */
function applyIsometricPerspective(scene, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const isoAngle = Math.PI / 6;
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;

  if (isometricWorldEnabled && isIsometric) {
    canvas.app.stage.rotation = -isoAngle;
    canvas.app.stage.skew.set(isoAngle, 0);
    adjustAllTokensAndTilesForIsometric();
    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("Isometric perspective applied.");
    }
  } else {
    canvas.app.stage.rotation = 0;
    canvas.app.stage.skew.set(0, 0);
    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("Isometric perspective removed.");
    }
  }
}

/**
 * Aplica a transformação isométrica a todos os tokens e tiles presentes no canvas.
 */
function adjustAllTokensAndTilesForIsometric() {
  canvas.tokens.placeables.forEach(token => applyIsometricTransformation(token, true));
  canvas.tiles.placeables.forEach(tile => applyIsometricTransformation(tile, true));
}

/**
 * Aplica a transformação isométrica a um objeto específico (token ou tile).
 * Ajusta a rotação, escala e posição com base na transformação isométrica.
 * 
 * @param {Token|Tile} object - O token ou tile a ser transformado.
 * @param {boolean} isIsometric - Indica se o modo isométrico está habilitado.
*/
function applyIsometricTransformation(object, isIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");

  if (!object.mesh) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Mesh não encontrado para o objeto:", object);
    }
    return;
  }

  if (isometricWorldEnabled && isIsometric) {
    object.mesh.rotation = Math.PI / 4;
    object.mesh.skew.set(0, 0);

    const isoScale = object.document.getFlag(MODULE_ID, 'scale') ?? 1;

    if (object instanceof Token) {
      const tokenScale = object.document.texture;
      const tokenDimW = object.document.width;
      const tokenDimH = object.document.height;

      object.mesh.scale.set(
        tokenScale.scaleX * tokenDimH * isoScale,
        tokenScale.scaleY * tokenDimW * isoScale
      );

      const offsetX = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      const offsetY = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;

      const isoOffsets = cartesianToIso(offsetX, offsetY);
      object.mesh.position.set(
        object.document.x + isoOffsets.x,
        object.document.y + isoOffsets.y
      );

    } else if (object instanceof Tile) {
      const tileScale = object.document.texture;
      const tileDimW = object.document.width;
      const tileDimH = object.document.height;
      const reverseTransform = object.document.getFlag(MODULE_ID, 'reverseTransform') ?? true;

      if (reverseTransform) {
        const baseWidth = tileDimW * Math.cos(Math.PI / 4);
        object.mesh.scale.set(
          tileScale.scaleX * baseWidth * isoScale,
          tileScale.scaleY * tileDimH * isoScale
        );
      } else {
        object.mesh.scale.set(
          tileScale.scaleX * tileDimW * isoScale,
          tileScale.scaleY * tileDimH * isoScale
        );
      }

      object.mesh.position.set(object.document.x, object.document.y);
    }

  } else {
    object.mesh.rotation = 0;
    object.mesh.skew.set(0, 0);
    object.mesh.scale.set(1, 1);
    object.mesh.position.set(object.document.x, object.document.y);
  }
}

/**
 * Aplica a transformação isométrica ao background de uma cena.
 * Ajusta rotação, escala e posição para o modo isométrico.
 * 
 * @param {Scene} scene - A cena cujo background será transformado.
 * @param {boolean} isIsometric - Indica se o modo isométrico está habilitado.
 * @param {boolean} shouldTransform - Indica se o background deve ser transformado.
 */
function applyBackgroundTransformation(scene, isIsometric, shouldTransform) {
  if (!canvas?.primary?.background) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Background não encontrado.");
    }
    return;
  }

  const background = canvas.primary.background;
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;

  if (isometricWorldEnabled && isIsometric && shouldTransform) {
    background.rotation = Math.PI / 4;
    background.skew.set(0, 0);
    background.anchor.set(0.5, 0.5);
    background.transform.scale.set(2 * scale, 2 * scale * Math.sqrt(3));

    const s = canvas.scene;
    const paddingX = s.width * s.padding;
    const paddingY = s.height * s.padding;

    const offsetX = s.background.offsetX || 0;
    const offsetY = s.background.offsetY || 0;

    background.position.set(
      (s.width / 2) + paddingX + offsetX,
      (s.height / 2) + paddingY + offsetY
    );

    if (canvas.environment.primary.foreground) {
      const foreground = canvas.environment.primary.foreground;
      foreground.anchor.set(0.5, 0.5);
      foreground.transform.scale.set(1, 1);
      foreground.transform.setFromMatrix(canvas.stage.transform.worldTransform.invert());
      foreground.position.set(
        (s.width / 2) + paddingX + (s.foreground?.offsetX || 0),
        (s.height / 2) + paddingY + (s.foreground?.offsetY || 0)
      );
    }

  } else {
    background.rotation = 0;
    background.skew.set(0, 0);
    background.position.set(canvas.scene.width / 2, canvas.scene.height / 2);

    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("Background transformation reset.");
    }
  }
}

