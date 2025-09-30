// src/core/award.js
import {
  applyAwards,
  loadMultiXP,
  saveMultiXP,
  applyDailyDecay,
  recomputeDailyPerks,
  XP_TYPES,
} from "./multixp.js";
import { loadProfile, saveProfile } from "./profile.js";
import {
  ACH_CATALOG,
  loadAchievements,
  saveAchievements,
  evaluateAchievements, // Changed from applyBranchTaskAchievements to evaluateAchievements
} from "./achievements.js";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function statsKeyFor(dateISO) { return `qj_stats_today_${dateISO}`; }
function readTodayStats() {
  const key = statsKeyFor(todayISO());
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || {
      doneTasks: 0, activeMinutes: 0, doneByBranch: {}
    };
  } catch {
    return { doneTasks: 0, activeMinutes: 0, doneByBranch: {} };
  }
}
function writeTodayStats(stats) {
  const key = statsKeyFor(todayISO());
  try { localStorage.setItem(key, JSON.stringify(stats)); } catch {}
}

/** ≥50% rule for primary branch */
function primaryBranchOf(xpAwards) {
  const totals = Object.values(xpAwards || {}).map(v => parseInt(v,10) || 0);
  const sum = totals.reduce((a,b)=>a+b,0);
  if (sum <= 0) return null;
  let best = null, bestVal = 0;
  for (const k of XP_TYPES) {
    const v = parseInt(xpAwards?.[k] || 0, 10) || 0;
    if (v > bestVal) { bestVal = v; best = k; }
  }
  return bestVal / sum >= 0.5 ? best : null;
}

/**
 * Award XP when a task is completed.
 * - incGlobalXP: function(delta) -> void (e.g., v => setXp(p => p + v))
 * - expects task = { baseXp|xp, xpAwards? }
 */
export function awardXPForTask(task, incGlobalXP) {
  // 1) legacy global XP (always)
  const base = Math.max(1, parseInt(task?.baseXp ?? task?.xp ?? 1, 10) || 1);
  if (typeof incGlobalXP === "function") incGlobalXP(base);

  // 2) daily decay pass (idempotent per day)
  const pre = loadMultiXP();
  const { state: decayed } = applyDailyDecay(pre);
  saveMultiXP(decayed);

  // 3) branch awards (if any)
  const awards = task?.xpAwards && typeof task.xpAwards === "object" ? task.xpAwards : {};
  let post = decayed;
  if (Object.keys(awards).length > 0) {
    const res = applyAwards(decayed, awards);
    post = res.state;
    saveMultiXP(post);
  }

  // 4) Update daily stats (doneTasks + primary branch by ≥50% rule)
  try {
    const stats = readTodayStats();
    stats.doneTasks = (stats.doneTasks || 0) + 1;

    const primary = primaryBranchOf(awards);
    if (primary) {
      stats.doneByBranch = stats.doneByBranch || {};
      stats.doneByBranch[primary] = (stats.doneByBranch[primary] || 0) + 1;
    }
    writeTodayStats(stats);
    // some daily perks depend on stats
    recomputeDailyPerks(stats);
  } catch {}

  // 5) SYNC into profile (including lifetime counters for primary)
  const prof = loadProfile();
  prof.multixp = { ...prof.multixp, ...post };

  if (!prof.lifetime) prof.lifetime = {};
  if (!prof.lifetime.doneByBranch) prof.lifetime.doneByBranch = {};
  const primary = primaryBranchOf(awards); // Note: primary is redefined here, consider reusing the earlier variable
  if (primary) {
    prof.lifetime.doneByBranch[primary] =
      (prof.lifetime.doneByBranch[primary] || 0) + 1;
  }

  // 6) 🔸 Sync Achievements (branch-based, pure-unlock; no extra XP here)
  try {
    const prevAch = loadAchievements();
    const ctx = { tasks: [], level: prof.level || 0 }; // Adjust ctx as needed based on your app's data
    const achState = { unlocked: prevAch?.unlocked || [], all: ACH_CATALOG };
    const nextAch = evaluateAchievements(ctx, achState); // Use evaluateAchievements
    saveAchievements(nextAch);
    prof.ach = nextAch;
  } catch (e) {
    console.warn("ach sync failed", e);
  }

  saveProfile(prof);
  return { base };
}