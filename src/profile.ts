export const outfits = [
  {
    id: "classic",
    name: "Classic Chale",
    shirt: "#ffda3d",
    shorts: "#244b83",
    description: "The original compound legend.",
  },
  {
    id: "fresh",
    name: "Fresh Teal",
    shirt: "#42dfc4",
    shorts: "#163d50",
    description: "Fresh look. Same fast feet.",
  },
  {
    id: "midnight",
    name: "Midnight",
    shirt: "#b99aff",
    shorts: "#583785",
    description: "Bring a little night-time energy.",
  },
] as const;
export type OutfitId = (typeof outfits)[number]["id"];
export function readOutfit(value: string | null): OutfitId {
  return outfits.find((outfit) => outfit.id === value)?.id ?? "classic";
}
export function survivalBadge(seconds: number) {
  if (seconds >= 60) return "CERTIFIED LEGEND";
  if (seconds >= 40) return "DODGE MASTER";
  if (seconds >= 20) return "QUICK FEET";
  return "COMPOUND ROOKIE";
}
