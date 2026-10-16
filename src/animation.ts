import type { World } from "./engine";
export type HeroPose = "idle" | "run" | "dodge" | "hit" | "victory";
export const ATLAS_COLUMNS = 4;
export const ATLAS_ROWS = 4;
// Run playback follows distance, so slowing down or pausing freezes the feet naturally.
export function spriteFrame(pose: HeroPose, distance = 0, seconds = 0): number {
  switch (pose) {
    case "run":
      return Math.floor(Math.max(0, distance) / 24) % 8;
    case "dodge":
      return 9 + (Math.floor(Math.max(0, seconds) * 12) % 2);
    case "hit":
      return 11;
    case "victory":
      return 12 + (Math.floor(Math.max(0, seconds) * 8) % 4);
    default:
      return 8;
  }
}
export function heroPose(world: World): HeroPose {
  if (world.status === "lost") return "hit";
  if (world.status === "won") return "victory";
  if (world.readyFor > 0) return "idle";
  if (world.elapsed < world.dodgeUntil) return "dodge";
  return world.moving ? "run" : "idle";
}
