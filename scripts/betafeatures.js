
// Modificar o sort dos tokens conforme eles são alterados na cena.
// Infelizmente, muito pesado para fazer isto de forma automática desta forma.

// Modify the sort property of tokens as they change in the scene.
// Unfortunately, a heavy hit in performance to do this automatically this way.


function calculateTokenSort(tokenData) {
	// Obtém as dimensões do canvas da cena atual
	const dimensions = canvas.scene.dimensions;
	
	if (!dimensions) return 0; // Retorna 0 se as dimensões não forem encontradas
 
	const { sceneX, sceneY, width, height } = dimensions;
 
	// Define os pontos do plano cartesiano da cena
	const points = {
	  A: { x: sceneX, y: sceneY + height },            // Canto superior esquerdo
	  B: { x: sceneX + width, y: sceneY + height },    // Canto superior direito
	  C: { x: sceneX + width, y: sceneY },             // Canto inferior direito
	  D: { x: sceneX, y: sceneY }                      // Canto inferior esquerdo
	};
 
	// Obtém a posição atual do token
	const tokenX = tokenData.x;
	const tokenY = tokenData.y;
 
	// Calcula a distância ao longo de uma diagonal do plano cartesiano (B -> D)
	const maxDiagonalDistance = Math.sqrt(Math.pow(points.B.x - points.D.x, 2) + Math.pow(points.B.y - points.D.y, 2));
	const tokenDiagonalDistance = Math.sqrt(Math.pow(tokenX - points.D.x, 2) + Math.pow(tokenY - points.D.y, 2));
 
	// Converte a distância para um valor inteiro de z-order (invertendo a relação)
	const sortValue = Math.round(((tokenDiagonalDistance / maxDiagonalDistance)) * 10000);
	
	return sortValue;
}


Hooks.on("updateToken", (scene, tokenData, updateData, options, userId) => {
	// Apenas processa se o token foi movido (mudança nas coordenadas)
	if (!updateData.x && !updateData.y) return;
 
	// Calcula o novo valor de z-order (sort)
	const sortValue = calculateTokenSort(tokenData);
 
	// Encontra o token na cena e aplica o sort
	const token = canvas.tokens.get(tokenData.id);
	if (token) {
	  token.document.update({ sort: sortValue });
	}
});
 
// Hook adicional para recalcular o sort sempre que o token for alterado de outra maneira
Hooks.on("createToken", (scene, tokenData) => {
	// Calcula o novo valor de z-order (sort)
	const sortValue = calculateTokenSort(tokenData);
 
	// Encontra o token recém-criado e aplica o sort
	const token = canvas.tokens.get(tokenData.id);
	if (token) {
	  token.document.update({ sort: sortValue });
	}
});
 
Hooks.on("deleteToken", (tokenData) => {
	// Caso precise recalcular o z-order após a exclusão de um token, você pode usar esse hook se necessário
	// Não é necessário recalcular o z-order em tokens deletados, mas se for necessário, implemente conforme o caso
});

/*
Hooks.on("refreshToken", (tokenData) => {
	const sortValue = calculateTokenSort(tokenData);
	
	// Encontra o token recém-criado e aplica o sort
	const token = canvas.tokens.get(tokenData.id);
	if (token) {
		token.document.update({ sort: sortValue });
	}
});
*/