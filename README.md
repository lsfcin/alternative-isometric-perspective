# Isometric Perspective

![Isometric Map Example](https://raw.githubusercontent.com/arlosmolten/isometric-perspective/refs/heads/main/files/banner.jpg)

![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v12+-green)
![Static Badge](https://img.shields.io/badge/license%20-%20MIT-blue)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/H2H1160UID)


This module changes the map, tiles and token artwork/sprite for use with maps and tokens drawn using an isometric perspective.

## Features

Here are some of the features the module offers.

- **Dual Canvas Perspectives:** You can use top-down or isometric maps. In native isometric mode, you can adjust the scale of the map.
- **Token Sprite Adjustments:** You can fine-tune the position of the token sprite, as well as its scale. Increasing the size of the token automatically increases the size of the sprite.
- **Tile Sprite Adjustments:** You can also fine-tune the sprite position and scale, making easy to copy and paste multiple tiles.
- **Token Height Visual Cues:** If a token has any elevation, its sprite will be repositioned to reflect this height and two shadow and line sprites will be created to help identify its position.

### Compatibility
The basic operation of this module consists of applying a transformation to the canvas (rotate and skew) to achieve the isometric perspective, while undoing this transformation in art/sprite of background, tokens and tiles. In this way, it preserves compatibility with most of the core functionalities and with modules that do not directly interact with these systems. Native functions of templates, drawings and lighting work normally.

## Images

*Token and map art provided by [Epic Isometric.](https://www.patreon.com/c/epicisometric/posts)*

![](https://raw.githubusercontent.com/arlosmolten/isometric-perspective/refs/heads/main/files/scene-config.jpg)

*Scene configuration.*

![](https://raw.githubusercontent.com/arlosmolten/isometric-perspective/refs/heads/main/files/token-config.jpg)

*Token configuration.*

![](https://raw.githubusercontent.com/arlosmolten/isometric-perspective/refs/heads/main/files/tile-config.jpg)

*Tile configuration.*

![](https://raw.githubusercontent.com/arlosmolten/isometric-perspective/refs/heads/main/files/elevation.jpg)

*Elevation previews.*

## Known Bugs

- **Scene Grid Configuration**: The canvas background configuration in Scene Settings > Grid > Ruler Tool ( <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/37eff7fa00de26db41183a3ad8ed0e9119fbc44b/svgs/solid/ruler-combined.svg" width="15" height="15"></i> ) does not work.
  - **Workaround**: The art scale function has been recreated in the Isometric tab, and the offset function can be accessed in the Grid tab.

- **TokenHud and TileHud Position**: The position of the TileHud (menu on right-clicking a tile) is aligned with the left vertex, but sometimes will be far away from the token/tile.

  - **Workaround**: In most cases, running the macro below is enough to fix the issue:
    ```javascript
    canvas.draw()
    ```

## To-Do List

- [ ] Change tokens properties (vision) change token position.
- [ ] Add new perspectives.
- [ ] Check compatibility with other modules.
- [ ] Code to handle tiles and walls.

## Contribution

Contributions are welcome! If you want to improve this module, feel free to open an issue or submit a pull request.

## License

This project is under the MIT license. See the [LICENSE](LICENSE) file for more details.