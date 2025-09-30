// src/core/gamify.js
const BASE_XP = 1000;   // درخواست تو
const GROWTH = 1.10;    // هر مرحله ~10% سخت‌تر

export function xpForLevel(l) {
  if (l <= 1) return BASE_XP;
  return Math.round(BASE_XP * Math.pow(GROWTH, Math.max(0, l - 1)));
}

export function sumToReachLevel(l) {
  // xp لازم از سطح 1 تا ابتدای سطح l
  if (l <= 1) return 0;
  return Math.round((BASE_XP * (Math.pow(GROWTH, l - 1) - 1)) / (GROWTH - 1));
}

export function levelFromXP(xp) {
  if (xp <= 0) return 1;
  // پیدا کردن l با حل معکوس سری هندسی
  const val = (xp * (GROWTH - 1)) / BASE_XP + 1;
  const l = Math.floor(Math.log(Math.max(val, 1)) / Math.log(GROWTH)) + 1;
  return Math.max(1, l);
}

export function levelProgress(totalXP) {
  const level = levelFromXP(totalXP);
  const start = sumToReachLevel(level);
  const span = xpForLevel(level);
  const into = totalXP - start;
  const nextIn = Math.max(0, span - into);
  return { level, start, span, into, nextIn };
}
