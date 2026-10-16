# Chale, Dodge!

A portrait survival game built with Expo SDK 58, React Native, and TypeScript. Survive 60 seconds in a Ghanaian compound while tyres, slippers, and balls fly across the courtyard.

## Run it

Use Node.js 22.13+ and npm.

```sh
npm ci
npm start
```

Scan the development QR code with a compatible Expo Go installation. For a native development build, use `npx expo run:android` or `npx expo run:ios` with the appropriate native tooling. Your phone and development computer should be on the same network. For a browser preview:

```sh
npm run web
```

## Controls and rules

- Drag anywhere in the arena to move the character relative to your finger. Desktop also supports arrow keys / WASD.
- Survive 60 seconds. One collision ends the run.
- Incoming hazards briefly show a warning at the arena edge before moving.
- Near misses award 50 points, a reaction caption, and a short original sound.
- Pause using the top-right button (Escape on desktop). Backgrounding the app automatically pauses play.
- Best survival time and mute preference are saved on the device. Sharing sends a score message, not a video replay.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run export:web
```

The deterministic engine checks cover movement bounds, collisions, victory, terminal-state behaviour, and one-time near-miss rewards.

## Structure

- `src/app/`: Expo Router entry and root layout.
- `App.tsx`: game lifecycle, input, home, pause, results, storage, audio, and sharing.
- `src/engine.ts`: renderer-independent game rules in a fixed 360 × 600 coordinate space.
- `src/Art.tsx`: original scalable SVG character and obstacle art.
- `assets/courtyard.jpg`: AI-generated courtyard background, created for this game.
- `assets/audio/`: original synthesized reaction and victory sounds, with no third-party music or meme recordings.

The first prototype uses a JavaScript animation loop and React Native/SVG rendering with bounded hazard counts. Profile on target Android hardware before adding more art, particles, or effects. The visual concept boards are direction references; this build uses simpler original vector characters. Voice reactions, multiple arenas, character selection, replay video capture, and online leaderboards are future additions.

## Android preview build

Install EAS CLI, sign into your Expo account, and configure this repository with your own EAS project:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` includes an internal APK preview profile. No EAS account or remote build has been created automatically.
