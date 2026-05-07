export const MAX_HUNTER_LEVEL = 100;

export type HunterRank = "E" | "D" | "C" | "B" | "A" | "S";

export function isMaxHunterLevel(level?: number | null) {
  return (level ?? 0) >= MAX_HUNTER_LEVEL;
}

export function getHunterRank(level?: number | null): HunterRank {
  const currentLevel = Math.max(1, Math.min(MAX_HUNTER_LEVEL, level ?? 1));

  if (currentLevel <= 10) return "E";
  if (currentLevel <= 25) return "D";
  if (currentLevel <= 40) return "C";
  if (currentLevel <= 60) return "B";
  if (currentLevel <= 80) return "A";
  return "S";
}

export function getHunterRankClass(rank: HunterRank) {
  switch (rank) {
    case "S":
      return "rank-badge-s";
    case "A":
      return "rank-badge-a";
    case "B":
      return "rank-badge-b";
    case "C":
      return "rank-badge-c";
    case "D":
      return "rank-badge-d";
    case "E":
    default:
      return "rank-badge-e";
  }
}

export function getLevelProgressPercent(
  xp?: number | null,
  xpToNext?: number | null,
  level?: number | null,
) {
  if (isMaxHunterLevel(level)) {
    return 100;
  }

  if (!xpToNext || xpToNext <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, ((xp ?? 0) / xpToNext) * 100));
}

export function getLevelProgressText(
  xp?: number | null,
  xpToNext?: number | null,
  level?: number | null,
) {
  if (isMaxHunterLevel(level)) {
    return "MAX";
  }

  return `${xp ?? 0} / ${xpToNext ?? 0} XP`;
}

