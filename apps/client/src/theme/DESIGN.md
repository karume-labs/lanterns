# Lanterns visual design

## Palette

| Token    | Hex       | Use                               |
| -------- | --------- | --------------------------------- |
| Night    | `#101628` | Sky and deepest shadows           |
| Ink      | `#1d2942` | Panels and terrain outline        |
| Twilight | `#405070` | Stone and secondary UI            |
| Moon     | `#a8c4dc` | Text and cool highlights          |
| Lantern  | `#ffd166` | Fuel, warm light, calls to action |
| Ember    | `#ef8354` | Damage and danger                 |
| Moss     | `#74c69d` | Healing and success               |
| Builder  | `#5bc0eb` | Builder role                      |
| Medic    | `#f284b6` | Medic role                        |
| Striker  | `#f95738` | Striker role                      |
| Scout    | `#b8de6f` | Scout role                        |

The same role colors are the single source of truth in
`packages/domain/src/content/roles.ts`; sprites, HUD chips, and the rack all
read from there so world and UI never drift apart.

## Typography

- One pixel font, rendered at integer sizes only (12/16/24 px).
- Minimum legible size 12 px; numbers in the HUD use tabular alignment.
- Text over the world gets a 1 px ink outline so it survives the dark overlay.

## Layout and frames

- All panels and buttons use a 9-slice frame with 4 px corners in Ink/Twilight.
- The HUD anchors to safe-area insets and never covers the player, the
  lantern, or the crosshair area of the play field.
- Warm colors (Lantern/Ember) are reserved for objectives, fuel, and danger;
  interactive confirmations use Moss.

## World rendering

- Render at a low internal resolution and scale only by integers
  (`image-rendering: pixelated`, nearest-neighbor, no smoothing).
- Tiles align to the pixel grid; sprites never sit on half pixels.
- One dark overlay with a lantern-centered cutout carries the night mood;
  combat-critical elements (names, bars, damage numbers) draw above it.
- Dawn raises the sky tint and shrinks overlay opacity as the match progresses.

## Motion

- Screen shake is reserved for heavy hits and lantern damage; magnitude
  decays within 300 ms.
- Damage numbers rise and fade in ~700 ms; hit flashes last ~80 ms.
