# Isometric Perspective

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2F[marceloabner]%2F[isometric-perspective]%2Fmaster%2Fsrc%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange)
![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v11+-green)

O módulo **Isometric Perspective** para Foundry VTT transforma a experiência de jogo ao permitir uma visualização isométrica do seu mapa, proporcionando uma nova dimensão de interação e visualização para os jogadores. Este módulo é ideal para campanhas que utilizam mapas isométricos, oferecendo uma série de funcionalidades para personalização e ajuste.

## Funcionalidades

### Modo de Perspectiva

Estas são algumas das funcionalidade que o módulo possui.

| Função                           | Descrição                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| **Mudança de Perspectiva**       | Muda a perspectiva do canvas de top-down para isométrico, com os modos 2D e nativo disponíveis. |
| **Mapa 2D em Projeção Isométrica** | Apresenta os elementos do jogo em um formato 2D isométrico.                                  |
| **Mapa Isométrico Nativo**      | Utiliza mapas isométricos nativos para uma visualização mais imersiva.                      |
| **Ajuste de Escala**            | Permite ajustar a escala do mapa isométrico nativo, oferecendo flexibilidade na visualização.|

### Ajustes de Token

| Função                          | Descrição                                                                                     |
|---------------------------------|-----------------------------------------------------------------------------------------------|
| **Posição da Arte do Token**    | Ajusta a posição da arte do token com base na elevação, criando uma sensação de profundidade. |
| **Deslocamento da Arte do Token**| Ajusta o deslocamento da arte do token em relação ao grid.                                   |
| **Escala da Arte do Token**     | Facilita o ajuste de escala da arte para cada token, melhorando a personalização.            |
| **Aumento de Tamanho do Token** | Aumentar o tamanho do token (1x1 -> 2x2) aumenta automaticamente a arte correspondente.      |

### Ajustes de Tile

| Função                           | Descrição                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| **Ajuste Fino de Escala**       | Permite ajuste fino da escala da arte dos tiles nas configurações.                           |
| **Ajuste Fino de Deslocamento**  | Ajuste do deslocamento da arte do tile, disponível nas configurações.                        |

### Integração Nativa

- **Compatibilidade**: O módulo utiliza funções nativas do Foundry para templates, desenhos e iluminação, minimizando possíveis incompatibilidades com outros módulos.

## Imagens

*Adicione imagens ilustrativas abaixo para demonstrar as funcionalidades do módulo e como ele se integra ao Foundry VTT. Por exemplo, capturas de tela mostrando a mudança de perspectiva, ajustes de token e tile podem ser muito úteis para os usuários.*

![Exemplo de Mapa Isométrico](link-da-imagem)

## To-Do Lista

- [ ] Adicionar offset da arte do Tile.
- [ ] Adicionar novas perspectivas.
- [ ] Verificar compatibilidade com outros módulos.

## Bugs Conhecidos

- **Posição do TileHud**: A posição do TileHud (menu ao clicar com o botão direito sobre o tile) é alinhada com o vértice da esquerda.

  - **Solução Alternativa**: Na maioria das vezes, executar a macro abaixo é suficiente para corrigir o problema:
    ```javascript
    canvas.draw()
    ```

## Contribuição

Contribuições são bem-vindas! Se você deseja melhorar este módulo, sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.