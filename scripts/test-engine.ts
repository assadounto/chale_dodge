import assert from "node:assert/strict";
import { createWorld, step, aim, DURATION } from "../src/engine";
const w = createWorld();
aim(w, -100, 900);
assert.equal(w.targetX, 35);
assert.equal(w.targetY, 560);
step(w, 0.04);
assert.ok(w.x < 180 && w.y > 450);
const hit = createWorld();
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
const win = createWorld();
win.elapsed = DURATION - 0.01;
win.spawnIn = 10;
step(win, 0.02);
assert.equal(win.status, "won");
const pause = JSON.stringify(win);
step(win, 0.04);
assert.equal(JSON.stringify(win), pause);
const dodge = createWorld();
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
  "Engine checks passed: movement bounds, collision, victory, terminal state, near-miss scoring.",
);
