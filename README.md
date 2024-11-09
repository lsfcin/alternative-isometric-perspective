# Isometric Perspective

![Repository License](https://img.shields.io/github/license/marceloabner/isometric-perspective)
![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v12+-green)

The **Isometric Perspective** module for Foundry VTT enhances the gameplay experience by enabling an isometric view of your map, offering players a new dimension of interaction and visualization. This module is ideal for campaigns using isometric maps, providing a range of features for customization and adjustment.

## Features

### Perspective Mode

Here are some of the features the module offers.

| Feature                          | Description                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| **Perspective Shift**            | Changes the canvas perspective from top-down to isometric, with both 2D and native modes available. |
| **2D Isometric Projection**      | Presents game elements in a 2D isometric format.                                              |
| **Native Isometric Map**         | Uses native isometric maps for a more immersive view.                                         |
| **Scale Adjustment**             | Allows adjusting the scale of the native isometric map, providing flexibility in viewing.      |

### Token Adjustments

| Feature                          | Description                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| **Token Art Position**           | Adjusts the position of token art based on elevation, creating a sense of depth.              |
| **Token Art Offset**             | Adjusts the offset of token art relative to the grid.                                         |
| **Token Art Scale**              | Facilitates scale adjustment of art for each token, enhancing customization.                  |
| **Token Size Increase**          | Increasing token size (1x1 -> 2x2) automatically scales up the corresponding art.            |

### Tile Adjustments

| Feature                          | Description                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| **Fine Scale Adjustment**        | Allows fine-tuning of tile art scale in the settings.                                         |
| **Fine Offset Adjustment**       | Adjusts the offset of tile art, available in settings.                                        |

### Native Integration

- **Compatibility**: The module uses Foundry's native functions for templates, drawings, and lighting, minimizing potential compatibility issues with other modules.

## Images

*Add illustrative images below to showcase the module's features and how it integrates with Foundry VTT. For example, screenshots showing the perspective shift, token, and tile adjustments may be very helpful for users.*

![Isometric Map Example](link-to-image)

## To-Do List

- [ ] Add Tile Art Offset.
- [ ] Add new perspectives.
- [ ] Check compatibility with other modules.

## Known Bugs

- **TileHud Position**: The position of the TileHud (menu on right-clicking a tile) is aligned with the left vertex.

  - **Workaround**: In most cases, running the macro below is enough to resolve the issue:
    ```javascript
    canvas.draw()
    ```

## Contribution

Contributions are welcome! If you want to improve this module, feel free to open an issue or submit a pull request.

## License

This project is under the MIT license. See the [LICENSE](LICENSE) file for more details.
