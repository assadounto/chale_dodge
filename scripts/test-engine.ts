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
const win = runningWorld();
win.elapsed = DURATION - 0.01;
win.spawnIn = 10;
step(win, 0.02);
assert.equal(win.status, "won");
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
step(dodge, 0.04);
assert.equal(dodge.dodges, 1);
console.log(
  "Engine checks passed: movement bounds, collision, victory, terminal state, near-miss scoring, countdown, animation, difficulty stages.",
);
