export { isoToCartesian, cartesianToIso, calculateIsometricPosition };

/**
 * Converte coordenadas isométricas para coordenadas cartesianas.
 * Usado para ajustar posições de objetos que foram transformados em modo isométrico.
 * 
 * @param {number} isoX - A coordenada X em espaço isométrico.
 * @param {number} isoY - A coordenada Y em espaço isométrico.
 * @returns {Object} Um objeto com as coordenadas `x` e `y` em espaço cartesiano.
 */
function isoToCartesian(isoX, isoY) {
  const angle = Math.PI / 4;  // 45 graus em radianos
  return {
    x: isoX * Math.cos(angle) - isoY * Math.sin(angle),
    y: isoX * Math.sin(angle) + isoY * Math.cos(angle)
  };
}

/**
 * Converte coordenadas cartesianas para coordenadas isométricas.
 * Usado para calcular posições que precisam ser ajustadas para o modo isométrico.
 * 
 * @param {number} cartX - A coordenada X em espaço cartesiano.
 * @param {number} cartY - A coordenada Y em espaço cartesiano.
 * @returns {Object} Um objeto com as coordenadas `x` e `y` em espaço isométrico.
 */
function cartesianToIso(cartX, cartY) {
  const angle = Math.PI / 4;  // 45 graus em radianos
  return {
    x: cartX * Math.cos(-angle) - cartY * Math.sin(-angle),
    y: cartX * Math.sin(-angle) + cartY * Math.cos(-angle)
  };
}

/**
 * Calcula a posição isométrica de um ponto baseado nas coordenadas X e Y.
 * Útil para ajustar a posição de HUDs ou outros elementos que precisam seguir uma lógica de posicionamento isométrico.
 * 
 * @param {number} x - A coordenada X do ponto em espaço cartesiano.
 * @param {number} y - A coordenada Y do ponto em espaço cartesiano.
 * @returns {Object} Um objeto com as coordenadas `x` e `y` em espaço isométrico.
 */
function calculateIsometricPosition(x, y) {
  const isoAngle = Math.PI / 6;  // 30 graus em radianos
  const isoX = (x + y) * Math.cos(isoAngle);
  const isoY = (-1) * (x - y) * Math.sin(isoAngle);
  return { x: isoX, y: isoY };
}

