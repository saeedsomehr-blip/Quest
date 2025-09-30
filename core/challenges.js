// src/core/challenges.js
const K = {
  TPL_D: "qj_daily_templates_v1",
  TPL_W: "qj_weekly_templates_v1",
  DAY: (d) => `qj_day_${d}`,
  WEEK: (w) => `qj_week_${w}`,
};

export const DEFAULT_DAILY_XP = 250;
export const DEFAULT_WEEKLY_XP = 500;

export const todayStr = () => new Date().toISOString().slice(0, 10);
export function weekKeyOf(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function loadDailyTemplates() {
  return load(K.TPL_D, ["Drink water", "Walk 20 minutes", "Read 10 pages"].map((t, i) => ({ id: `d${i}`, title: t })));
}
export function saveDailyTemplates(arr) { save(K.TPL_D, arr); }

export function loadWeeklyTemplates() {
  return load(K.TPL_W, [{ id: "w0", title: "Workout 3 times", xp: 500 }, { id: "w1", title: "Cook 2 home meals", xp: 500 }]);
}
export function saveWeeklyTemplates(arr) { save(K.TPL_W, arr); }

function randomPicks(ids, n) {
  const a = [...ids], p = [];
  while (a.length && p.length < n) p.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return p;
}

export function ensureTodayState(templates) {
  const key = K.DAY(todayStr());
  const cur = load(key, null);
  if (cur && cur.date === todayStr()) return cur;
  const picks = randomPicks(templates.map(t => t.id), 2);
  const next = { date: todayStr(), picks, completedIds: [] };
  save(key, next);
  return next;
}
export function loadTodayState() { return load(K.DAY(todayStr()), { date: todayStr(), picks: [], completedIds: [] }); }
export function saveTodayState(st) { save(K.DAY(todayStr()), st); }

export function ensureWeekState(templates) {
  const wk = weekKeyOf();
  const key = K.WEEK(wk);
  const cur = load(key, null);
  if (cur && cur.weekKey === wk) return cur;
  const picks = randomPicks(templates.map(t => t.id), 2);
  const next = { weekKey: wk, picks, completedIds: [] };
  save(key, next);
  return next;
}
export function loadWeekState() { return load(K.WEEK(weekKeyOf()), { weekKey: weekKeyOf(), picks: [], completedIds: [] }); }
export function saveWeekState(st) { save(K.WEEK(weekKeyOf()), st); }
