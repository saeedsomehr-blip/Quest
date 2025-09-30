// src/core/perkEngine.js
import { PERK_RULES } from "./perkRules.data.js";

/** Check if profile satisfies requires */
function meets(profile, requires, { level = 0 } = {}) {
  if (!requires) return true;
  const xp = profile?.multixp?.xp || {};
  const streak = profile?.meta?.streak || 0;

  if (requires.level && level < requires.level) return false;
  if (requires.streak && streak < requires.streak) return false;
  if (requires.branchAt) {
    for (const [k, at] of Object.entries(requires.branchAt)) {
      if ((xp[k] || 0) < at) return false;
    }
  }
  return true;
}

/** Return list of newly unlocked perk rules (ids) */
export function evaluateNewPerks(profile, ownedIds, { level = 0 } = {}) {
  const have = new Set(ownedIds || []);
  const out = [];
  for (const r of PERK_RULES) {
    if (have.has(r.id)) continue;
    if (meets(profile, r.requires, { level })) out.push(r);
  }
  return out;
}

/** Apply all owned perk effects to awards map {BR:amount} */
export function applyPerkEffects(awards, ownedIds) {
  if (!awards || !ownedIds?.length) return awards;
  let globalMult = 1;
  const branchMult = {};

  // fold effects
  for (const id of ownedIds) {
    const rule = PERK_RULES.find(x => x.id === id);
    if (!rule?.effects) continue;
    if (rule.effects.globalMult) globalMult *= rule.effects.globalMult;
    if (rule.effects.branchMult) {
      for (const [br, m] of Object.entries(rule.effects.branchMult)) {
        branchMult[br] = (branchMult[br] || 1) * m;
      }
    }
  }

  const out = {};
  for (const [br, amt] of Object.entries(awards)) {
    const base = Math.max(0, parseInt(amt || 0, 10) || 0);
    const bm = branchMult[br] || 1;
    out[br] = Math.round(base * globalMult * bm);
  }
  return out;
}
