// src/core/achievements.js
// ─────────────────────────────────────────────────────────────────────────────
// Storage shape: { unlocked: [{ id, label, tier, type, icon, gainedAt, xpReward, description }] }
// evaluateAchievements(ctx, prev, awardFn?) → nextState
//   ctx: { tasks, level }
//   awardFn payload: { global?: number, multi?: Record<string, number>, reason?: string }
// ─────────────────────────────────────────────────────────────────────────────

import { loadProfile } from "./profile.js";

// Public load/save (localStorage)
export function loadAchievements() {
  try { return JSON.parse(localStorage.getItem("qj_ach_v2") || "{}"); }
  catch { return {}; }
}
export function saveAchievements(ach) {
  try { localStorage.setItem("qj_ach_v2", JSON.stringify(ach || {})); }
  catch {}
}

/**
 * ACH_CATALOG
 * type: productivity | social | learning | health | weekly | evergreen | time | meta
 * tier: higher = better
 * description: short EN explanation (shown in AchievementsHall under each card)
 * xpReward: one-time global XP on first unlock of this *id*
 * xpAwards: per-branch XP (multi-XP) — keys: WISDOM, STRENGTH, SOCIAL, TRADE, HEALTH, ATHLETICS
 */
export const ACH_CATALOG = [
  // ── Productivity (daily completions) ──────────────────────────────────────
  { id: "prod_1",  type: "productivity", tier: 1, label: "Task Starter",
    need: { doneToday: 1 },  icon: "🚀", xpReward: 5,
    xpAwards: { TRADE: 8, STRENGTH: 4 },
    description: "Complete your first task of the day. Momentum begins here." },

  { id: "prod_3",  type: "productivity", tier: 2, label: "Task Sprinter",
    need: { doneToday: 3 },  icon: "🏃", xpReward: 15,
    xpAwards: { TRADE: 18, STRENGTH: 8 },
    description: "Finish 3 tasks in a single day to build rhythm." },

  { id: "prod_5",  type: "productivity", tier: 3, label: "Task Master",
    need: { doneToday: 5 },  icon: "🏆", xpReward: 30,
    xpAwards: { TRADE: 30, STRENGTH: 12 },
    description: "Finish 5 tasks in one day. Serious focus." },

  { id: "prod_10", type: "productivity", tier: 4, label: "Productivity Legend",
    need: { doneToday: 10 }, icon: "🌟", xpReward: 50,
    xpAwards: { TRADE: 60, STRENGTH: 20 },
    description: "Crush 10 tasks in a day. Legendary output." },

  // ── Social (category-based legacy need; now also backed by lifetime branch counters) ──────────
  { id: "soc_1",  type: "social", tier: 1, label: "Friendly Face",
    need: { totalDone: 5,  socialTasks: 1 },  icon: "😊", xpReward: 10,
    xpAwards: { SOCIAL: 14, WISDOM: 4 },
    description: "Complete one social task (e.g., call a friend)." },

  { id: "soc_5",  type: "social", tier: 2, label: "Social Star",
    need: { totalDone: 20, socialTasks: 5 },  icon: "🤝", xpReward: 25,
    xpAwards: { SOCIAL: 30, WISDOM: 8 },
    description: "Complete 5 social tasks; nurture your connections." },

  { id: "soc_10", type: "social", tier: 3, label: "Community Leader",
    need: { totalDone: 50, socialTasks: 10 }, icon: "🎤", xpReward: 50,
    xpAwards: { SOCIAL: 60, WISDOM: 12 },
    description: "Complete 10 social tasks; you lead by relating." },

  // ── Learning (Wisdom) ─────────────────────────────────────────────────────
  { id: "learn_1",  type: "learning", tier: 1, label: "Curious Mind",
    need: { totalDone: 5,  learningTasks: 1 },  icon: "📚", xpReward: 10,
    xpAwards: { WISDOM: 16 },
    description: "Complete one learning task (e.g., study or read)." },

  { id: "learn_5",  type: "learning", tier: 2, label: "Knowledge Seeker",
    need: { totalDone: 20, learningTasks: 5 },  icon: "🧠", xpReward: 25,
    xpAwards: { WISDOM: 34 },
    description: "Complete 5 learning tasks; expand your horizons." },

  { id: "learn_10", type: "learning", tier: 3, label: "Wise Scholar",
    need: { totalDone: 50, learningTasks: 10 }, icon: "🦉", xpReward: 50,
    xpAwards: { WISDOM: 70 },
    description: "Complete 10 learning tasks; mastery in motion." },

  // ── Health ────────────────────────────────────────────────────────────────
  { id: "health_1",  type: "health", tier: 1, label: "Wellness Beginner",
    need: { totalDone: 5,  healthTasks: 1 },  icon: "🧘", xpReward: 10,
    xpAwards: { HEALTH: 12, ATHLETICS: 6 },
    description: "Complete one health task (e.g., short workout or breathwork)." },

  { id: "health_5",  type: "health", tier: 2, label: "Vitality Booster",
    need: { totalDone: 20, healthTasks: 5 },  icon: "💪", xpReward: 25,
    xpAwards: { HEALTH: 28, ATHLETICS: 12 },
    description: "Complete 5 health tasks; stronger body and mind." },

  { id: "health_10", type: "health", tier: 3, label: "Health Guru",
    need: { totalDone: 50, healthTasks: 10 }, icon: "🌿", xpReward: 50,
    xpAwards: { HEALTH: 60, ATHLETICS: 20 },
    description: "Complete 10 health tasks; wellness is your way." },

  // ── Weekly consistency ────────────────────────────────────────────────────
  { id: "week_7",  type: "weekly", tier: 1, label: "7-Day Rhythm",
    need: { activeDaysInLast: 7 },  icon: "📅", xpReward: 40,
    xpAwards: { TRADE: 12, SOCIAL: 12, WISDOM: 12, HEALTH: 12, ATHLETICS: 12, STRENGTH: 12 },
    description: "Stay active 7 consecutive days (≥1 task/day)." },

  { id: "week_14", type: "weekly", tier: 2, label: "Fortnight Flow",
    need: { activeDaysInLast: 14 }, icon: "🗓️", xpReward: 80,
    xpAwards: { TRADE: 20, SOCIAL: 20, WISDOM: 20, HEALTH: 20, ATHLETICS: 20, STRENGTH: 20 },
    description: "Stay active 14 consecutive days. Habits locked in." },

  // ── Evergreen: level milestones ───────────────────────────────────────────
  { id: "lvl_5",  type: "evergreen", tier: 1, label: "Level 5",
    need: { levelAtLeast: 5 },  icon: "🥉", xpReward: 25,
    xpAwards: { WISDOM: 8, STRENGTH: 8 },
    description: "Reach level 5. You're on track." },

  { id: "lvl_10", type: "evergreen", tier: 2, label: "Level 10",
    need: { levelAtLeast: 10 }, icon: "🥈", xpReward: 50,
    xpAwards: { WISDOM: 12, STRENGTH: 12 },
    description: "Reach level 10. Consistency paying off." },

  { id: "lvl_20", type: "evergreen", tier: 3, label: "Level 20",
    need: { levelAtLeast: 20 }, icon: "🥇", xpReward: 120,
    xpAwards: { WISDOM: 20, STRENGTH: 20 },
    description: "Reach level 20. A serious milestone." },

  // ── Evergreen: total completions ──────────────────────────────────────────
  { id: "tot_10",  type: "evergreen", tier: 1, label: "Rookie 10",
    need: { totalDone: 10 },  icon: "🎖️", xpReward: 15,
    xpAwards: { TRADE: 10 },
    description: "Complete 10 tasks overall." },

  { id: "tot_50",  type: "evergreen", tier: 2, label: "Worker 50",
    need: { totalDone: 50 },  icon: "🏅", xpReward: 40,
    xpAwards: { TRADE: 30 },
    description: "Complete 50 tasks overall." },

  { id: "tot_200", type: "evergreen", tier: 3, label: "Grinder 200",
    need: { totalDone: 200 }, icon: "🏆", xpReward: 150,
    xpAwards: { TRADE: 80, STRENGTH: 20 },
    description: "Complete 200 tasks overall. Relentless." },

  // ── Time-of-day ───────────────────────────────────────────────────────────
  { id: "time_early", type: "time", tier: 1, label: "Early Bird",
    need: { anyDoneBetween: [5, 8] }, icon: "🌅", xpReward: 15,
    xpAwards: { WISDOM: 10, HEALTH: 6 },
    description: "Complete a task between 5–8 AM." },

  { id: "time_night", type: "time", tier: 1, label: "Night Owl",
    need: { anyDoneBetween: [0, 5] }, icon: "🌙", xpReward: 15,
    xpAwards: { WISDOM: 6, STRENGTH: 10 },
    description: "Complete a task between midnight and 5 AM." },
];

// ────────────────────────────────────────────────────────────────────────────
// Summarize tasks (legacy category-based path still supported)
function summarize(tasks) {
  const done = (Array.isArray(tasks) ? tasks : []).filter(t => t.done);
  const now = Date.now();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

  const doneToday = done.filter(t => {
    const d = new Date(t.doneAt || t.createdAt || 0).getTime();
    return d >= startOfToday.getTime();
  }).length;

  const totalDone = done.length;

  // active days (last 30d)
  const days = new Set();
  for (const t of done) {
    const ts = new Date(t.doneAt || t.createdAt || 0).getTime();
    if (Number.isFinite(ts) && (now - ts) <= 30 * 86400000) {
      days.add(new Date(ts).toISOString().slice(0, 10));
    }
  }

  // category counts (optional—only if you set task.category)
  const socialTasks   = done.filter(t => t.category === "social").length;
  const learningTasks = done.filter(t => t.category === "learning").length;
  const healthTasks   = done.filter(t => t.category === "health").length;

  function anyDoneBetween(hStart, hEnd) {
    return done.some(t => {
      const d = new Date(t.doneAt || t.createdAt || 0);
      const h = d.getHours();
      return h >= hStart && h < hEnd;
    });
  }

  return {
    doneToday,
    totalDone,
    activeDaysCount: days.size,
    anyDoneBetween,
    socialTasks,
    learningTasks,
    healthTasks,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Need checks (legacy, uses task.category if present)
function meetsNeed(need, ctx, sum) {
  if (!need) return false;

  if (need.doneToday != null)         return sum.doneToday >= need.doneToday;
  if (need.activeDaysInLast != null)  return sum.activeDaysCount >= need.activeDaysInLast;
  if (need.levelAtLeast != null)      return (ctx.level || 0) >= need.levelAtLeast;

  // with category constraint
  if (need.totalDone != null && need.socialTasks != null)
    return sum.totalDone >= need.totalDone && sum.socialTasks >= need.socialTasks;

  if (need.totalDone != null && need.learningTasks != null)
    return sum.totalDone >= need.totalDone && sum.learningTasks >= need.learningTasks;

  if (need.totalDone != null && need.healthTasks != null)
    return sum.totalDone >= need.totalDone && sum.healthTasks >= need.healthTasks;

  if (need.totalDone != null)         return sum.totalDone >= need.totalDone;

  if (need.anyDoneBetween) {
    const [hs, he] = need.anyDoneBetween;
    return sum.anyDoneBetween(hs, he);
  }
  return false;
}

// ────────────────────────────────────────────────────────────────────────────
// NEW: Branch-based unlocking via profile lifetime counters (≥50% rule upstream)
const BRANCH_THRESHOLDS = {
  social:   [1, 5, 10],
  learning: [1, 5, 10], // maps to WISDOM
  health:   [1, 5, 10],
};
const TYPE_TO_BRANCH = {
  social:   "SOCIAL",
  learning: "WISDOM",
  health:   "HEALTH",
};

function unlockBranchByProfileCounters(unlockedArr, awardFn) {
  const prof = loadProfile();
  const counts = prof?.lifetime?.doneByBranch || {};

  const has = (id) => unlockedArr.some(u => u.id === id);

  for (const a of ACH_CATALOG) {
    const type = (a.type || "").toLowerCase();
    if (!BRANCH_THRESHOLDS[type]) continue;        // only social|learning|health
    const tier = Number(a.tier || 0);
    if (tier < 1) continue;

    const branch = TYPE_TO_BRANCH[type];
    const need = BRANCH_THRESHOLDS[type][Math.min(tier - 1, BRANCH_THRESHOLDS[type].length - 1)];
    const have = Number(counts?.[branch] || 0);

    if (!has(a.id) && have >= need) {
      // unlock + award
      unlockedArr.push({
        id: a.id,
        label: a.label,
        tier: a.tier,
        type: a.type,
        icon: a.icon || "🏆",
        gainedAt: new Date().toISOString(),
        xpReward: a.xpReward || 0,
        description: a.description || "",
      });
      if (typeof awardFn === "function") {
        awardFn({
          global: a.xpReward || 0,
          multi:  a.xpAwards || {},
          reason: `Achievement: ${a.label}`,
        });
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Evaluate & unlock (legacy + branch-counters)
export function evaluateAchievements(ctx, prev, awardFn) {
  const safePrev = prev && typeof prev === "object" ? prev : {};
  const unlocked = Array.isArray(safePrev.unlocked) ? [...safePrev.unlocked] : [];

  const has = (id) => unlocked.some(u => u.id === id);

  const add = (a) => {
    const entry = {
      id: a.id,
      label: a.label,
      tier: a.tier,
      type: a.type,
      icon: a.icon || "🏆",
      gainedAt: new Date().toISOString(),
      xpReward: a.xpReward || 0,
      description: a.description || "",
    };
    unlocked.push(entry);

    // one-shot rewards for first unlock of this id
    if (typeof awardFn === "function") {
      awardFn({
        global: a.xpReward || 0,
        multi:  a.xpAwards || {},
        reason: `Achievement: ${a.label}`,
      });
    }
  };

  // Legacy (category / time / productivity / weekly / level / totals)
  const sum = summarize(ctx.tasks || []);
  for (const a of ACH_CATALOG) {
    if (!has(a.id) && meetsNeed(a.need, ctx, sum)) add(a);
  }

  // NEW: branch-based unlocks backed by lifetime counters
  unlockBranchByProfileCounters(unlocked, awardFn);

  const next = { unlocked };
  if (JSON.stringify(next) !== JSON.stringify(safePrev)) return next;
  return safePrev;
}
