// src/core/profile.js
// Atomic profile storage + migration from older scattered keys.

const PROFILE_KEY = "qj_profile_v1";

// Legacy keys (if present)
const LEGACY = {
  multixp: "qj_multixp_state_v1",
  perks: "qj_perks_v1",
  seen: "qj_seen_events_v1",
};

export function defaultProfile() {
  return {
    // multi-XP: { xp: {WISDOM:0,...}, lastDecayDate:'YYYY-MM-DD' ... }
    multixp: { xp: {}, lastDecayDate: null, version: 1 },
    // perks: owned ids
    perks: { owned: [], rulesVersion: 1 },
    // events: unlocked once
    events: { seen: [] },
    // meta (streaks / caps etc.)
    meta: { streak: 0, lastActiveDate: null, version: 1 },
  };
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    const p = JSON.parse(raw);
    return mergeDefaults(p);
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function mergeDefaults(p) {
  const d = defaultProfile();
  return {
    multixp: { ...d.multixp, ...(p?.multixp || {}) },
    perks: { ...d.perks, ...(p?.perks || {}) },
    events: { ...d.events, ...(p?.events || {}) },
    meta: { ...d.meta, ...(p?.meta || {}) },
  };
}

/** One-time migration from legacy scattered keys into atomic profile */
export function migrateProfileFromLegacy() {
  try {
    const existing = localStorage.getItem(PROFILE_KEY);
    if (existing) return; // already migrated

    const prof = defaultProfile();
    // multixp
    const m = localStorage.getItem(LEGACY.multixp);
    if (m) {
      try { prof.multixp = { ...prof.multixp, ...JSON.parse(m) }; } catch {}
    }
    // perks
    const pr = localStorage.getItem(LEGACY.perks);
    if (pr) {
      try { prof.perks.owned = JSON.parse(pr) || []; } catch {}
    }
    // events
    const ev = localStorage.getItem(LEGACY.seen);
    if (ev) {
      try { prof.events.seen = JSON.parse(ev) || []; } catch {}
    }
    saveProfile(prof);
  } catch {
    /* noop */
  }
}
