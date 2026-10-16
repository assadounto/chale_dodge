export const arenas = [
  { id: "compound", name: "Compound Trouble", description: "Flying slippers, rolling tyres. The original wahala.", hint: "Survive 60 seconds. One hit ends the run." },
  { id: "market", name: "Market Madness", description: "Bouncing tomatoes. Crossing crates. Shopping just got serious.", hint: "Tomatoes bounce twice. Watch the crate lanes." },
] as const;
export type ArenaId = (typeof arenas)[number]["id"];
export function readArena(value: string | null): ArenaId {
  return arenas.find((arena) => arena.id === value)?.id ?? "compound";
}
export const bestKey = (arena: ArenaId) => arena === "compound" ? "chale.best" : "chale.best.market";
