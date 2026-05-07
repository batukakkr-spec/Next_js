import { getHunterRank, getHunterRankClass, type HunterRank } from "@/lib/hunter-rank";

export interface LeaderboardProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  level: number | null;
  xp: number | null;
  streak_days: number | null;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  displayName: string;
  level: number;
  xp: number;
  streakDays: number;
  rank: HunterRank;
  rankClass: string;
}

export function buildLeaderboardEntries(
  profiles: LeaderboardProfile[],
  limit?: number,
): LeaderboardEntry[] {
  const normalized = [...profiles]
    .map((profile) => {
      const level = Math.max(1, profile.level ?? 1);
      const xp = Math.max(0, profile.xp ?? 0);
      const streakDays = Math.max(0, profile.streak_days ?? 0);
      const rank = getHunterRank(level);

      return {
        user_id: profile.user_id,
        username: profile.username,
        displayName: profile.display_name ?? profile.username ?? "Unknown Hunter",
        level,
        xp,
        streakDays,
        rank,
        rankClass: getHunterRankClass(rank),
      };
    })
    .sort((left, right) => {
      if (right.level !== left.level) return right.level - left.level;
      if (right.xp !== left.xp) return right.xp - left.xp;
      if (right.streakDays !== left.streakDays) return right.streakDays - left.streakDays;
      return left.displayName.localeCompare(right.displayName);
    });

  return typeof limit === "number" ? normalized.slice(0, limit) : normalized;
}
