const K = {
  TASKS: "qj_tasks_v2",
  XP: "qj_xp_v1",
  LISTS: "qj_lists_v1",
  ACTIVE: "qj_active_list_v1",
};

export function loadTasks() {
  try { return JSON.parse(localStorage.getItem(K.TASKS)) ?? []; }
  catch { return []; }
}
export function saveTasks(arr) {
  try { localStorage.setItem(K.TASKS, JSON.stringify(arr)); } catch {}
}

export function loadXP() {
  try { return Number(localStorage.getItem(K.XP)) || 0; }
  catch { return 0; }
}
export function saveXP(xp) {
  try { localStorage.setItem(K.XP, String(xp)); } catch {}
}

export function loadLists() {
  try { return JSON.parse(localStorage.getItem(K.LISTS)) ?? [{ id:"inbox", name:"Inbox" }]; }
  catch { return [{ id:"inbox", name:"Inbox" }]; }
}
export function saveLists(ls) {
  try { localStorage.setItem(K.LISTS, JSON.stringify(ls)); } catch {}
}

export function loadActiveListId() {
  try { return localStorage.getItem(K.ACTIVE) || "inbox"; }
  catch { return "inbox"; }
}
export function saveActiveListId(id) {
  try { localStorage.setItem(K.ACTIVE, id); } catch {}
}
