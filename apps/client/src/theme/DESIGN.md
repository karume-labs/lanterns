# Lanterns design direction

## Mood

A small band of survivors holding a lantern against an endless night. Warm
light versus cold dark. Cozy but tense. Every screen feels lit by the lantern:
warm amber at the center, cold indigo at the edges.

## Rendering rules

- World renders at 320x180 internal resolution, integer scaling,
  nearest-neighbor only. No fractional scaling, no blur. Letterbox with
  night-ink bars when the aspect ratio does not fit.
- Overlay UI is HTML/CSS with `image-rendering: pixelated`, 9-slice
  `border-image` panels, and one pixel font family pair (Silkscreen headings,
  Pixelify body/numbers, both OFL - see `public/fonts/OFL-*.txt`). UI scales
  in whole-number steps.
- Tiles 16x16 art (32 world units). Player/enemy sprites 16x16, tank 24x24,
  boss 48x48.

## Palette (fixed, 24 max)

Defined once in `theme/colors.ts`, mirrored as CSS custom properties in
`index.css`, enforced repo-wide by `bun tools/check-palette.ts`.

- Night: ink `#0b0d1a`, indigo `#1a1b3a`, dusk violet `#3b2f5e`, slate
  `#5b5f7a`, fog `#9aa3b8`, bone `#f2ecd8`
- Light: lantern amber `#ffb43a`, flame orange `#ff7a1a`, warm yellow
  `#ffe27a`, ember red `#c4402b`
- Roles: Builder teal `#3fd0c9`, Medic green `#7be36b`, Striker red
  `#ff4b5c`, Scout blue `#6b8cff`, Keeper rose `#ff8fd1`, Lumen lavender
  `#c8a2ff` (23rd color: a sixth role needs its own identity hue)
- Enemies: gloom magenta `#7a1f5c`, rot green `#4f7a2a`, shade purple
  `#5a3a8a`, bone-pale `#cfc7b0`
- Dawn: dawn pink `#ff9ec2`, dawn gold `#ffd27a`, sky teal `#5fc7c0`
- Additions need justification here before use.

## Typography

Silkscreen for headings/labels, Pixelify (tabular figures) for body and
numbers. Minimum body size equals 8px at internal scale, never smaller.
Timers and counters use tabular numerals (`.num`).

## Motion

- Screen transitions 150-250 ms, stepped (no smooth easing). Light-spreading
  iris wipe centered on the lantern icon where possible; simple fade is the
  reduced-motion fallback.
- Buttons: 2-frame press (down 1px, darker inset), hover glow on desktop
  only (`@media (hover: hover) and (pointer: fine)`).
- `prefers-reduced-motion` and the in-game Reduce Motion toggle disable
  shake, flashes, and iris wipes.

## Accessibility

- Touch targets at least 48x48 CSS px. Critical buttons stay clear of the
  thumbs' travel arc on landscape phones.
- Every audio cue has a matching visual cue; the game is playable on mute.
- Color is never the only signal: roles differ by silhouette and icon,
  enemy types by shape.
- Volume sliders for Master, Music, SFX, Ambience plus a Mute toggle.
  Settings persist through the guarded storage helper (`app/storage.ts`).

## Architecture rules

- The Pixi world lives in `src/game` - no React imports there.
- Overlay UI is React + zustand in `components/` and `features/`.
- Per-frame values (timer, fuel, energy, health) update through refs/DOM,
  never React state.
- Original art, names, and sounds only. Third-party assets only when OFL or
  equivalent, always attributed in `public/CREDITS.md`.
