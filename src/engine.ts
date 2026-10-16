export const WIDTH = 360;
export const HEIGHT = 600;
export const DURATION = 60;
export type Hazard = {
  id: number;
  kind: "tyre" | "slipper" | "ball";
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
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  hazards: Hazard[];
  spawnIn: number;
  nextId: number;
  dodges: number;
  score: number;
  status: "playing" | "lost" | "won";
  reaction: string;
  reactionUntil: number;
  event: number;
};
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export function createWorld(): World {
  return {
    x: 180,
    y: 450,
    targetX: 180,
    targetY: 450,
    elapsed: 0,
    hazards: [],
    spawnIn: 1,
    nextId: 0,
    dodges: 0,
    score: 0,
    status: "playing",
    reaction: "",
    reactionUntil: 0,
    event: 0,
  };
}
export function aim(w: World, x: number, y: number) {
  w.targetX = clamp(x, 35, WIDTH - 35);
  w.targetY = clamp(y, 95, HEIGHT - 40);
}
function spawn(w: World, random: () => number) {
  const kind = (["tyre", "slipper", "ball"] as const)[Math.floor(random() * 3)];
  const side = Math.floor(random() * 3);
  const x =
    side === 0 ? -25 : side === 1 ? WIDTH + 25 : 35 + random() * (WIDTH - 70);
  const y = side === 2 ? -25 : 130 + random() * 300;
  const angle = Math.atan2(w.y - y, w.x - x) + (random() - 0.5) * 0.5;
  const speed = 100 + w.elapsed * 2 + (kind === "slipper" ? 35 : 0);
  w.hazards.push({
    id: w.nextId++,
    kind,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: kind === "tyre" ? 20 : kind === "ball" ? 14 : 13,
    age: 0,
    warned: 0.65,
    closest: Infinity,
    rewarded: false,
  });
}
export function step(w: World, delta: number, random = Math.random) {
  if (w.status !== "playing") return;
  const dt = clamp(delta, 0, 0.04);
  w.elapsed = Math.min(DURATION, w.elapsed + dt);
  const dx = w.targetX - w.x,
    dy = w.targetY - w.y,
    d = Math.hypot(dx, dy),
    move = Math.min(d, 340 * dt);
  if (d > 0) {
    w.x += (dx / d) * move;
    w.y += (dy / d) * move;
  }
  w.spawnIn -= dt;
  if (w.spawnIn <= 0) {
    spawn(w, random);
    w.spawnIn = Math.max(0.35, 1.05 - w.elapsed * 0.012);
  }
  for (const h of w.hazards) {
    h.age += dt;
    if (h.age < h.warned) continue;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    const distance = Math.hypot(h.x - w.x, h.y - w.y);
    const prev = h.closest;
    h.closest = Math.min(prev, distance);
    if (distance < h.radius + 12) {
      w.status = "lost";
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
