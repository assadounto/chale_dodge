import type { ArenaId } from "./arenas";
export const WIDTH = 360;
export const HEIGHT = 600;
export const DURATION = 60;
export type HazardKind = "tyre" | "slipper" | "ball" | "tomato" | "crate";
export type Hazard = {
  id: number;
  kind: HazardKind;
  entered?: boolean;
  bounces?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  warned: number;
  closest: number;
  rewarded: boolean;
};
export type World = {
  arena: ArenaId;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  readyFor: number;
  distance: number;
  moving: boolean;
  facing: number;
  hazards: Hazard[];
  spawnIn: number;
  nextId: number;
  dodges: number;
  score: number;
  status: "playing" | "lost" | "won";
  hitBy: Hazard["kind"] | null;
  reaction: string;
  reactionUntil: number;
  dodgeUntil: number;
  event: number;
};
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export function createWorld(arena: ArenaId = "compound"): World {
  return {
    arena,
    x: 180,
    y: 450,
    targetX: 180,
    targetY: 450,
    elapsed: 0,
    readyFor: 3,
    distance: 0,
    moving: false,
    facing: 1,
    hazards: [],
    spawnIn: 1,
    nextId: 0,
    dodges: 0,
    score: 0,
    status: "playing",
    hitBy: null,
    reaction: "",
    reactionUntil: 0,
    dodgeUntil: 0,
    event: 0,
  };
}
export function aim(w: World, x: number, y: number) {
  w.targetX = clamp(x, 35, WIDTH - 35);
  w.targetY = clamp(y, 95, HEIGHT - 40);
}
function spawn(w: World, random: () => number) {
  const kinds: HazardKind[] = w.arena === "market" ? ["tomato", "crate", "tyre"] : ["tyre", "slipper", "ball"];
  const kind = kinds[Math.floor(random() * kinds.length)];
  const side = Math.floor(random() * (kind === "crate" ? 2 : 3));
  const x =
    side === 0 ? -25 : side === 1 ? WIDTH + 25 : 35 + random() * (WIDTH - 70);
  const y = kind === "crate" ? [170, 290, 410, 520][Math.floor(random() * 4)] : side === 2 ? -25 : 130 + random() * 300;
  const angle = Math.atan2(w.y - y, w.x - x) + (random() - 0.5) * 0.5;
  const speed = 100 + w.elapsed * 2 + (kind === "slipper" ? 35 : 0);
  w.hazards.push({
    id: w.nextId++,
    kind,
    x,
    y,
    vx: kind === "crate" ? (side === 0 ? 1 : -1) * (80 + w.elapsed) : Math.cos(angle) * speed,
    vy: kind === "crate" ? 0 : Math.sin(angle) * speed,
    radius: kind === "crate" ? 23 : kind === "tyre" ? 20 : kind === "ball" || kind === "tomato" ? 14 : 13,
    entered: false,
    bounces: kind === "tomato" ? 2 : 0,
    age: 0,
    warned: kind === "crate" ? 1 : 0.65,
    closest: Infinity,
    rewarded: false,
  });
}
export function step(w: World, delta: number, random = Math.random) {
  if (w.status !== "playing") return;
  const dt = clamp(delta, 0, 0.04);
  if (w.readyFor > 0) {
    w.readyFor = Math.max(0, w.readyFor - dt);
    w.targetX = w.x;
    w.targetY = w.y;
    return;
  }
  w.elapsed = Math.min(DURATION, w.elapsed + dt);
  const dx = w.targetX - w.x,
    dy = w.targetY - w.y,
    d = Math.hypot(dx, dy),
    move = Math.min(d, 340 * dt);
  w.moving = move > 0.1;
  w.distance += move;
  if (Math.abs(dx) > 0.1) w.facing = dx < 0 ? -1 : 1;
  if (d > 0) {
    w.x += (dx / d) * move;
    w.y += (dy / d) * move;
  }
  w.spawnIn -= dt;
  if (w.spawnIn <= 0) {
    if (w.arena !== "market" || w.hazards.length < 12) spawn(w, random);
    w.spawnIn = w.arena === "market" ? Math.max(0.55, 1.3 - w.elapsed * 0.01) : Math.max(0.35, 1.05 - w.elapsed * 0.012);
  }
  for (const h of w.hazards) {
    h.age += dt;
    if (h.age < h.warned) continue;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.kind === "tomato") {
      if (!h.entered && h.x >= 20 && h.x <= WIDTH - 20 && h.y >= 85 && h.y <= HEIGHT - 20) h.entered = true;
      if (h.entered && (h.bounces ?? 0) > 0) {
        const horizontal = (h.x < 20 && h.vx < 0) || (h.x > WIDTH - 20 && h.vx > 0);
        const vertical = (h.y < 85 && h.vy < 0) || (h.y > HEIGHT - 20 && h.vy > 0);
        if (horizontal || vertical) {
          if (horizontal) { h.vx *= -1; h.x = clamp(h.x, 20, WIDTH - 20); }
          if (vertical) { h.vy *= -1; h.y = clamp(h.y, 85, HEIGHT - 20); }
          h.bounces = (h.bounces ?? 0) - 1;
        }
      }
    }
    const distance = Math.hypot(h.x - w.x, h.y - w.y);
    const prev = h.closest;
    h.closest = Math.min(prev, distance);
    const collides = h.kind === "crate"
      ? Math.hypot(w.x - clamp(w.x, h.x - h.radius, h.x + h.radius), w.y - clamp(w.y, h.y - h.radius, h.y + h.radius)) < 12
      : distance < h.radius + 12;
    if (collides) {
      w.status = "lost";
      w.hitBy = h.kind;
      w.event++;
      break;
    }
    if (!h.rewarded && prev < h.radius + 40 && distance > prev + 2) {
      h.rewarded = true;
      w.dodges++;
      w.reaction = ["EII! TOO CLOSE!", "SMOOTH, CHALE!", "NOT TODAY!"][
        w.dodges % 3
      ];
      w.reactionUntil = w.elapsed + 1;
      w.dodgeUntil = w.elapsed + 0.22;
      w.event++;
    }
  }
  w.hazards = w.hazards.filter(
    (h) => h.x > -100 && h.x < WIDTH + 100 && h.y > -100 && h.y < HEIGHT + 100,
  );
  w.score = Math.floor(w.elapsed * 10) + w.dodges * 50;
  if (w.status === "playing" && w.elapsed >= DURATION) {
    w.status = "won";
    w.event++;
  }
}

export function difficulty(elapsed: number) {
  return elapsed < 20
    ? "WARM-UP"
    : elapsed < 45
      ? "FULL WAHALA"
      : "FINAL STRETCH";
}
