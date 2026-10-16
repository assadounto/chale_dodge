# Character animation atlases

Three transparent 4 × 4 atlases (`classic.png`, `teal.png`, `purple.png`) preserve the illustrated Chale hero and existing outfit colours. Each runtime cell is 192 × 192 pixels, with the character centred on a consistent foot baseline.

| Cells (zero-based) | Motion                |
| ------------------ | --------------------- |
| 0–7                | Eight-frame run cycle |
| 8                  | Idle                  |
| 9–10               | Dodge poses           |
| 11                 | Hit recoil            |
| 12–15              | Victory dance         |

Built-in image generation was used with each existing outfit cutout as its identity reference. Prompt direction: exactly sixteen isolated full-body poses in an equal 4 × 4 grid, transparent background, same character/costume/camera/scale, a right-facing eight-frame run cycle with distinct arm/leg positions, idle and left/right dodges, shocked hit recoil, and four joyful dance poses. No UI, text, floor, motion marks, or extra portraits.

`python scripts/prepare-atlas.py SOURCE.png OUTPUT.png` extracts complete sprite bounds and aligns them into runtime cells. This preparation script requires Pillow, NumPy, and SciPy; none is a runtime/mobile dependency.

Running follows movement distance. The active game's simulation time selects dodge frames, so pausing freezes them. Victory playback runs only while that pose is mounted and the app is active. The renderer moves one cached image behind a clipped viewport, rather than changing image sources every frame. The game hitbox and movement speed are unchanged by the visual poses.
