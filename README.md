# Chale, Dodge!

A portrait survival game built with Expo SDK 57, React Native, and TypeScript. Survive 60 seconds in a Ghanaian compound while tyres, slippers, and balls fly across the courtyard.

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
- The character faces the direction of travel and animates its stride when moving.
- Incoming hazards briefly show a warning at the arena edge before moving.
- Near misses award 50 points, a reaction caption, and a short original sound.
- Pause using the top-right button (Escape on desktop). Backgrounding the app automatically pauses play.
- Use **Change Look** on the home screen to choose Classic Chale, Fresh Teal, or Midnight. All outfits are free cosmetics with the same speed and hitbox.
- Best survival time, mute preference, and selected outfit are saved on the device. Sharing sends a score message, not a video replay.
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
- `src/Art.tsx`: original scalable SVG character and obstacle art.
- `src/profile.ts`: outfit definitions, saved-selection validation, and survival badges.
- `assets/courtyard.jpg`: AI-generated courtyard background, created for this game.
- `assets/audio/`: original synthesized reaction and victory sounds, with no third-party music or meme recordings.

The first prototype uses a JavaScript animation loop and React Native/SVG rendering with bounded hazard counts. Profile on target Android hardware before adding more art, particles, or effects. The visual concept boards are direction references; this build uses simpler original vector characters. Voice reactions, multiple arenas, additional characters, replay video capture, and online leaderboards are future additions.

## Android preview build

Install EAS CLI, sign into your Expo account, and configure this repository with your own EAS project:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

`eas.json` includes an internal APK preview profile. No EAS account or remote build has been created automatically.
