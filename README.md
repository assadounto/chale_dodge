# Chale, Dodge!

A portrait survival game built with Expo SDK 57, React Native, and TypeScript. Survive 60 seconds in Compound Trouble or Market Madness.

## Run it

Use Node.js 22.13+ and npm.

```sh
npm ci
npm start
```

This project targets **Expo SDK 57** to match the SDK 57 Expo Go app. Scan the development QR code with that Expo Go installation.

After pulling this compatibility update, stop any old Metro server and reinstall from the updated lockfile:

```sh
npm ci
npx expo start --go --clear
```

Open the new QR code in Expo Go. For a native development build, use `npx expo run:android` or `npx expo run:ios` with the appropriate native tooling. Your phone and development computer should be on the same network. For a browser preview:

```sh
npm run web
```

## Controls and rules

- Drag anywhere in the arena to move the character relative to your finger. Desktop also supports arrow keys / WASD.
- A three-second ready countdown precedes every run; no hazards spawn and the timer stays at zero until it ends.
- Survive 60 seconds. One collision ends the run.
- The HUD marks Warm-up (0–20s), Full Wahala (20–45s), and Final Stretch (45–60s). Speed and spawn frequency increase continuously.
- The illustrated character uses an eight-frame running cycle that follows movement distance, plus idle, dodge, hit-recoil, and victory-dance poses.
- Incoming hazards briefly show a warning at the arena edge before moving.
- Near misses award 50 points, a reaction caption, and a short original sound.
- Pause using the top-right button (Escape on desktop). Backgrounding the app automatically pauses play.
- Use **Outfits** on the home screen to choose Classic Chale, Fresh Teal, or Midnight. All outfits are free cosmetics with the same speed and hitbox.
- Each arena’s best survival time, selected arena, mute preference, and selected outfit are saved on the device. Sharing sends a score message, not a video replay.
- A collision freezes the arena for 650ms with a reaction naming the hazard that hit you, then opens the result card.
- Results award a survival badge: Compound Rookie (under 20s), Quick Feet (20–39.9s), Dodge Master (40–59.9s), or Certified Legend (60s).

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run export:web
```

The deterministic engine checks cover movement bounds, collisions, victory, terminal-state behaviour, one-time near-miss rewards, the countdown, animation state, and difficulty-stage boundaries.

Home and result menus scroll on short screens. Arena sizing accounts for device safe-area insets. The animation loop stops in menus and while paused.

## Structure

- `src/app/`: Expo Router entry and root layout.
- `App.tsx`: game lifecycle, input, home, pause, results, storage, audio, and sharing.
- `src/engine.ts`: renderer-independent game rules in a fixed 360 × 600 coordinate space.
- `src/Art.tsx`: illustrated character images and shaded SVG obstacles.
- `src/AnimatedHero.tsx` and `src/animation.ts`: atlas rendering, frame selection, and the victory clock.
- `assets/animation/`: three sixteen-pose sprite atlases and the frame map.
- `src/ui/`: comic title paths, gradient button faces, outlined headings, and reaction bursts.
- `assets/art/`: generated character cutouts, shocked reaction, and home street background.
- `assets/fonts/`: bundled Luckiest Guy display font and its Apache 2.0 license.
- `src/profile.ts`: outfit definitions, saved-selection validation, and survival badges.
- `assets/courtyard.jpg`: AI-generated courtyard background, created for this game.
- `assets/audio/`: original synthesized reaction and victory sounds, with no third-party music or meme recordings.

The first prototype uses a JavaScript animation loop and React Native/SVG rendering with bounded hazard counts. Profile on target Android hardware before adding more art, particles, or effects. The UI follows the visual concept boards with illustrated characters, a gold/turquoise outlined title, the bundled Luckiest Guy display font, chunky lime buttons, and comic reaction bursts. Animation uses aligned sprite atlases for all three outfits; the victory loop pauses in the background. Voice reactions, additional characters, replay video capture, and online leaderboards are future additions.

## Android preview build

Install EAS CLI, sign into your Expo account, and configure this repository with your own EAS project:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` includes an internal APK preview profile. No EAS account or remote build has been created automatically.

## UI preview

Actual browser captures of the implemented interface: [home](docs/screenshots/home.jpg), [outfits](docs/screenshots/outfits.jpg), and [results](docs/screenshots/result.jpg).

The rich UI pass was checked through home → outfit selection → countdown → pause/resume → game over. Saved outfit restoration after reload and Play visibility at 360 × 640 were also verified in the browser. Android/iOS device appearance and performance still need on-device testing.

## Animation preview

[Running and victory playback](docs/animation-preview.gif) shows the production atlas frames. Browser checks verified running frame progression, an unchanged frame while paused, the hit pose after collision, and victory frame progression/cleanup in an isolated renderer preview. No new native dependencies were added; the project remains on SDK 57.

## Market Madness

Choose **Arenas → Market Madness → Let’s Go**. Tomatoes rebound twice after entering the playfield; wooden crates cross horizontal lanes with a one-second lane warning. Tyres keep you moving. One hit ends the run, and close calls still trigger reactions and sound. Compound Trouble retains its original rules and saved best time. Both arenas are available immediately and remember separate records.

The market has at most 12 active hazards. Crates use square collision bounds with a circular player; tomatoes use circular collision bounds. Engine checks cover entry, rebound limits, crate corners, warning grace, arena selection fallback and isolated best-time keys.

Browser verification covered arena selection and reload restoration, crate lane warnings, pause/resume, results, saving a new market record without changing the compound record, and a 360 × 640 selector. Screenshots: [arena selector](docs/screenshots/arenas.jpg), [Market Madness](docs/screenshots/market.jpg). Web, Android and iOS bundles export with SDK 57; native-device playtesting remains.
