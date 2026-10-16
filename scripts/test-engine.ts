import { readArena, bestKey } from "../src/arenas";
import { readOutfit, survivalBadge } from "../src/profile";
import { heroPose, spriteFrame } from "../src/animation";
import assert from "node:assert/strict";
import { createWorld, step, aim, DURATION, difficulty } from "../src/engine";
function runningWorld() {
  const w = createWorld();
  w.readyFor = 0;
  return w;
}
const countdown = createWorld();
aim(countdown, 40, 100);
for (let i = 0; i < 70; i++) step(countdown, 0.04);
assert.equal(countdown.elapsed, 0);
assert.equal(countdown.hazards.length, 0);
assert.equal(countdown.x, 180);
assert.ok(countdown.readyFor > 0);
for (let i = 0; i < 6; i++) step(countdown, 0.04);
assert.equal(countdown.readyFor, 0);
step(countdown, 0.04);
assert.ok(countdown.elapsed > 0);
assert.equal(difficulty(0), "WARM-UP");
assert.equal(difficulty(20), "FULL WAHALA");
assert.equal(difficulty(45), "FINAL STRETCH");
const w = runningWorld();
aim(w, -100, 900);
assert.equal(w.targetX, 35);
assert.equal(w.targetY, 560);
step(w, 0.04);
assert.ok(w.x < 180 && w.y > 450);
assert.equal(w.facing, -1);
assert.ok(w.distance > 0);
assert.equal(w.moving, true);
aim(w, w.x, w.y);
step(w, 0.01);
assert.equal(w.moving, false);
const hit = runningWorld();
hit.hazards.push({
  id: 1,
  kind: "ball",
  x: 180,
  y: 450,
  vx: 0,
  vy: 0,
  radius: 14,
  age: 1,
  warned: 0,
  closest: Infinity,
  rewarded: false,
});
step(hit, 0.01);
assert.equal(hit.status, "lost");
assert.equal(hit.hitBy, "ball");
assert.equal(heroPose(hit), "hit");
const win = runningWorld();
win.elapsed = DURATION - 0.01;
win.spawnIn = 10;
step(win, 0.02);
assert.equal(win.status, "won");
assert.equal(heroPose(win), "victory");
const pause = JSON.stringify(win);
step(win, 0.04);
assert.equal(JSON.stringify(win), pause);
const dodge = runningWorld();
dodge.hazards.push({
  id: 1,
  kind: "ball",
  x: 230,
  y: 450,
  vx: 200,
  vy: 0,
  radius: 14,
  age: 1,
  warned: 0,
  closest: 45,
  rewarded: false,
});
step(dodge, 0.04);
assert.equal(dodge.dodges, 1);
assert.equal(heroPose(dodge), "dodge");
assert.ok(dodge.dodgeUntil > dodge.elapsed);
step(dodge, 0.04);
assert.equal(dodge.dodges, 1);

// Saved settings may come from older builds or a damaged local value.
assert.equal(readOutfit(null), "classic");
assert.equal(readOutfit("removed-outfit"), "classic");
assert.equal(readOutfit("midnight"), "midnight");
assert.equal(survivalBadge(19.9), "COMPOUND ROOKIE");
assert.equal(survivalBadge(20), "QUICK FEET");
assert.equal(survivalBadge(40), "DODGE MASTER");
assert.equal(survivalBadge(60), "CERTIFIED LEGEND");

assert.equal(heroPose(createWorld()), "idle");
const runner = runningWorld();
aim(runner, 300, 450);
step(runner, 0.04);
assert.equal(heroPose(runner), "run");
assert.deepEqual(
  Array.from({ length: 9 }, (_, i) => spriteFrame("run", i * 24)),
  [0, 1, 2, 3, 4, 5, 6, 7, 0],
);
assert.deepEqual(
  Array.from({ length: 5 }, (_, i) => spriteFrame("victory", 0, i / 8)),
  [12, 13, 14, 15, 12],
);
assert.equal(spriteFrame("idle"), 8);
assert.equal(spriteFrame("hit"), 11);
assert.equal(spriteFrame("dodge", 0, 0), 9);
assert.equal(spriteFrame("dodge", 0, 0.1), 10);
console.log(
  "Checks passed: game rules, profiles, pose priority, run frames, and victory loop.",
);

// Market rules preserve the original arena and storage key.
assert.equal(createWorld().arena, "compound");

assert.equal(readArena("unknown"), "compound");
assert.equal(readArena("market"), "market");
assert.equal(bestKey("compound"), "chale.best");
assert.notEqual(bestKey("market"), bestKey("compound"));
assert.equal(survivalBadge(5, "market"), "MARKET ROOKIE");
for (const [roll, kind] of [[0, "tomato"], [0.4, "crate"], [0.9, "tyre"]] as const) {
  const market = createWorld("market"); market.readyFor = 0; market.spawnIn = 0;
  const rolls = [roll, 0, 0.5, 0.5];
  step(market, 0.01, () => rolls.shift() ?? 0.5);
  assert.equal(market.hazards[0].kind, kind);
  if (kind === "crate") { assert.equal(market.hazards[0].vy, 0); assert.equal(market.hazards[0].warned, 1); }
}
const market = createWorld("market"); market.readyFor = 0; market.spawnIn = 100;
const tomato = { id: 1, kind: "tomato" as const, x: -25, y: 200, vx: 100, vy: 0, radius: 14, age: 1, warned: 0, closest: Infinity, rewarded: false, entered: false, bounces: 2 };
market.hazards = [tomato];
step(market, 0.04); assert.equal(tomato.vx, 100); assert.equal(tomato.bounces, 2);
tomato.x = 21; step(market, 0.01); assert.equal(tomato.entered, true);
tomato.x = 339; step(market, 0.04); assert.equal(tomato.vx, -100); assert.equal(tomato.bounces, 1);
step(market, 0.04); assert.equal(tomato.bounces, 1);
tomato.x = 21; step(market, 0.04); assert.equal(tomato.vx, 100); assert.equal(tomato.bounces, 0);
tomato.x = 339; step(market, 0.04); assert.equal(tomato.vx, 100); assert.ok(tomato.x > 340);
// Rebounding must not award a second close call for the same tomato.
tomato.rewarded = true; tomato.x = 230; tomato.y = 450; tomato.closest = 45;
step(market, 0.04); assert.equal(market.dodges, 0);
for (const [x, y, expected] of [[211, 481, "lost"], [214, 484, "playing"]] as const) {
  const crateWorld = createWorld("market"); crateWorld.readyFor = 0; crateWorld.spawnIn = 100;
  crateWorld.hazards = [{ ...tomato, kind: "crate", x, y, vx: 0, vy: 0, radius: 23 }];
  step(crateWorld, 0.01); assert.equal(crateWorld.status, expected);
}
const warning = createWorld("market"); warning.readyFor = 0; warning.spawnIn = 100;
warning.hazards = [{ ...tomato, kind: "crate", x: 180, y: 450, vx: 100, vy: 0, age: 0, warned: 1, radius: 23 }];
step(warning, 0.04); assert.equal(warning.status, "playing"); assert.equal(warning.hazards[0].x, 180);
console.log("Market checks passed: spawning, bounces, crate bounds, warning grace, and separate records.");
