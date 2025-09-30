// src/core/perkRules.data.js
// قواعد پرک‌ها — منبع واحد برای همه‌ی perkها (Skill + Achievement + Daily)
//
// نکته‌ها:
// - برای نودهای Skill، idها دقیقاً با id نودهای SkillForest یکسان نگه داشته شده‌اند
//   تا Owned شدن‌شان ساده باشد (perks.includes(node.id)).
// - برای Achievements، مقدار `achId` باید با IDهای واقعی کاتالوگ شما (ACH_CATALOG) هماهنگ شود.
// - پرک‌های Daily فقط چارچوب‌شان اینجاست؛ اثر روزانه در multixp.recomputeDailyPerks محاسبه و ذخیره می‌شود.

import { BR } from "./branches.js";

/**
 * هر Rule می‌تواند یکی از این شکل‌ها باشد:
 * {
 *   id: "wis_learner",
 *   label: "Learner",
 *   source: { type: "skill", nodeId: "wis_learner" } | { type: "ach", achId: "early_bird" } | { type: "daily" },
 *   kind: "permanent" | "daily",
 *   requires?: { branchAt?: { [BR.X]: levelNumber } },   // برای skill-based unlock
 *   effects?: { globalMult?: number, branchMult?: { [BR.X]: number } }, // اثر ثابت
 *   // برای اچیومنت‌های tiered:
 *   tiered?: { baseMult: number, perTier: number, branch?: keyof typeof BR }, // اگر branch نداشته باشد، اثر global است
 *   // برای پرک‌های روزانه:
 *   dailyCompute?: (ctx) => ({ globalMult?: number, branchMult?: Record<string, number> } | null)
 * }
 */

export const PERK_RULES = [
  // ───────────────────────────────────────────────────────────────────────────
  // SKILL NODES → Permanent Perks (idها با SkillForest یکی است)

  // Wisdom
  {
    id: "wis_learner",
    label: "Learner",
    source: { type: "skill", nodeId: "wis_learner" },
    kind: "permanent",
    requires: { branchAt: { [BR.WISDOM]: 5 } },
    effects: { branchMult: { [BR.WISDOM]: 1.10 } }, // +10% Wisdom XP
  },
  {
    id: "wis_scholar",
    label: "Scholar",
    source: { type: "skill", nodeId: "wis_scholar" },
    kind: "permanent",
    requires: { branchAt: { [BR.WISDOM]: 10 } },
    effects: { branchMult: { [BR.WISDOM]: 1.10 } },
  },
  {
    id: "wis_sage",
    label: "Sage",
    source: { type: "skill", nodeId: "wis_sage" },
    kind: "permanent",
    requires: { branchAt: { [BR.WISDOM]: 20 } },
    effects: { branchMult: { [BR.WISDOM]: 1.10 } },
  },

  // Strength
  {
    id: "str_grit",
    label: "Grit",
    source: { type: "skill", nodeId: "str_grit" },
    kind: "permanent",
    requires: { branchAt: { [BR.STRENGTH]: 5 } },
    effects: { branchMult: { [BR.STRENGTH]: 1.10 } },
  },
  {
    id: "str_brute",
    label: "Brute",
    source: { type: "skill", nodeId: "str_brute" },
    kind: "permanent",
    requires: { branchAt: { [BR.STRENGTH]: 10 } },
    effects: { branchMult: { [BR.STRENGTH]: 1.10 } },
  },
  {
    id: "str_gladiator",
    label: "Gladiator",
    source: { type: "skill", nodeId: "str_gladiator" },
    kind: "permanent",
    requires: { branchAt: { [BR.STRENGTH]: 20 } },
    effects: { branchMult: { [BR.STRENGTH]: 1.10 } },
  },

  // Social
  {
    id: "soc_charm",
    label: "Charm",
    source: { type: "skill", nodeId: "soc_charm" },
    kind: "permanent",
    requires: { branchAt: { [BR.SOCIAL]: 5 } },
    effects: { branchMult: { [BR.SOCIAL]: 1.10 } },
  },
  {
    id: "soc_orator",
    label: "Orator",
    source: { type: "skill", nodeId: "soc_orator" },
    kind: "permanent",
    requires: { branchAt: { [BR.SOCIAL]: 12 } },
    effects: { branchMult: { [BR.SOCIAL]: 1.10 } },
  },
  {
    id: "soc_diplomat",
    label: "Diplomat",
    source: { type: "skill", nodeId: "soc_diplomat" },
    kind: "permanent",
    requires: { branchAt: { [BR.SOCIAL]: 20 } },
    effects: { branchMult: { [BR.SOCIAL]: 1.10 } },
  },

  // Trade
  {
    id: "trd_haggler",
    label: "Haggler",
    source: { type: "skill", nodeId: "trd_haggler" },
    kind: "permanent",
    requires: { branchAt: { [BR.TRADE]: 5 } },
    effects: { branchMult: { [BR.TRADE]: 1.10 } },
  },
  {
    id: "trd_broker",
    label: "Broker",
    source: { type: "skill", nodeId: "trd_broker" },
    kind: "permanent",
    requires: { branchAt: { [BR.TRADE]: 12 } },
    effects: { branchMult: { [BR.TRADE]: 1.10 } },
  },
  {
    id: "trd_magnate",
    label: "Magnate",
    source: { type: "skill", nodeId: "trd_magnate" },
    kind: "permanent",
    requires: { branchAt: { [BR.TRADE]: 20 } },
    effects: { branchMult: { [BR.TRADE]: 1.10 } },
  },

  // Health
  {
    id: "hlt_focus",
    label: "Focus",
    source: { type: "skill", nodeId: "hlt_focus" },
    kind: "permanent",
    requires: { branchAt: { [BR.HEALTH]: 5 } },
    effects: { branchMult: { [BR.HEALTH]: 1.10 } },
  },
  {
    id: "hlt_resolve",
    label: "Resolve",
    source: { type: "skill", nodeId: "hlt_resolve" },
    kind: "permanent",
    requires: { branchAt: { [BR.HEALTH]: 12 } },
    effects: { branchMult: { [BR.HEALTH]: 1.10 } },
  },
  {
    id: "hlt_ironbody",
    label: "Iron Body",
    source: { type: "skill", nodeId: "hlt_ironbody" },
    kind: "permanent",
    requires: { branchAt: { [BR.HEALTH]: 20 } },
    effects: { branchMult: { [BR.HEALTH]: 1.10 } },
  },

  // Athletics
  {
    id: "ath_sprint",
    label: "Sprint",
    source: { type: "skill", nodeId: "ath_sprint" },
    kind: "permanent",
    requires: { branchAt: { [BR.ATHLETICS]: 5 } },
    effects: { branchMult: { [BR.ATHLETICS]: 1.10 } },
  },
  {
    id: "ath_agile",
    label: "Agile",
    source: { type: "skill", nodeId: "ath_agile" },
    kind: "permanent",
    requires: { branchAt: { [BR.ATHLETICS]: 12 } },
    effects: { branchMult: { [BR.ATHLETICS]: 1.10 } },
  },
  {
    id: "ath_swift",
    label: "Swift",
    source: { type: "skill", nodeId: "ath_swift" },
    kind: "permanent",
    requires: { branchAt: { [BR.ATHLETICS]: 20 } },
    effects: { branchMult: { [BR.ATHLETICS]: 1.10 } },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ACHIEVEMENTS → Tiered Permanent Perks
  // ⚠️ achIdها را با کاتالوگ واقعی خودت هماهنگ کن (ACH_CATALOG).
  // مثال‌ها:
  {
    id: "ach_early_bird",
    label: "Early Bird",
    source: { type: "ach", achId: "early_bird" }, // ← ID دقیق اچیومنت
    kind: "permanent",
    tiered: { baseMult: 1.05, perTier: 0.02, branch: BR.WISDOM },
  },
  {
    id: "ach_social_butterfly",
    label: "Social Butterfly",
    source: { type: "ach", achId: "socializer" },
    kind: "permanent",
    tiered: { baseMult: 1.05, perTier: 0.03, branch: BR.SOCIAL },
  },
  {
    id: "ach_iron_will",
    label: "Iron Will",
    source: { type: "ach", achId: "health_streak" },
    kind: "permanent",
    tiered: { baseMult: 1.05, perTier: 0.02, branch: BR.HEALTH },
  },
  {
    id: "ach_guild_network",
    label: "Guild Network",
    source: { type: "ach", achId: "networker" },
    kind: "permanent",
    // اگر branch ست نشه → اثر global می‌شود
    tiered: { baseMult: 1.03, perTier: 0.02 }, // Global multiplier
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DAILY PERKS (Framework) — اثرشان هر روز براساس todayStats محاسبه می‌شود
  // این قواعد ثابت‌اند، ولی خروجی روزانه در multixp.recomputeDailyPerks تولید می‌شود.

  {
    id: "daily_momentum",
    label: "Momentum (Daily)",
    source: { type: "daily" },
    kind: "daily",
    // هر ۵ کارِ امروز → +۵٪ Global (سقف +۲۰٪)
    dailyCompute: ({ todayStats }) => {
      const steps = Math.floor((todayStats.doneTasks || 0) / 5);
      const boost = Math.min(0.20, steps * 0.05);
      return boost > 0 ? { globalMult: 1 + boost } : null;
    },
  },

  // نمونه‌ی روزانه‌ی شاخه‌محور (اختیاری)
  {
    id: "daily_fitness_burst",
    label: "Fitness Burst (Daily)",
    source: { type: "daily" },
    kind: "daily",
    // هر 20 دقیقه فعالیت روزانه → +2% Athletics (سقف +20%)
    dailyCompute: ({ todayStats }) => {
      const mins = Math.max(0, todayStats.activeMinutes || 0);
      const boost = Math.min(0.20, Math.floor(mins / 20) * 0.02);
      return boost > 0 ? { branchMult: { [BR.ATHLETICS]: 1 + boost } } : null;
    },
  },
];
