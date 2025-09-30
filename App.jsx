import { useEffect, useMemo, useRef, useState } from "react";
import usePersist from "./hooks/usePersist.js";
import useTick from "./hooks/useTick.js";
import { uid, PRAISES, SYMBOLS } from "./utils/constants.js";
import { levelProgress } from "./core/gamify.js";
import {
  loadTasks, saveTasks, loadXP, saveXP,
  loadLists, saveLists, loadActiveListId, saveActiveListId
} from "./core/storage.js";
import {
  loadDailyTemplates, saveDailyTemplates, loadWeeklyTemplates, saveWeeklyTemplates,
  ensureTodayState, ensureWeekState, DEFAULT_DAILY_XP, DEFAULT_WEEKLY_XP,
  todayStr, weekKeyOf, saveTodayState, saveWeekState
} from "./core/challenges.js";
import { loadAchievements, saveAchievements, evaluateAchievements } from "./core/achievements.js";
import { mergePerksFromAchievements } from "./core/multixp.js";
import { computeDeadlineISO, nextDeadline } from "./core/dates.js";
import { timeLeft } from "./utils/time.js";
import JournalTab from "./components/JournalTab.jsx";
import { awardXPForTask } from "./core/award.js";
import { loadProfile, saveProfile, migrateProfileFromLegacy } from "./core/profile.js";
import { evaluateNewPerks, applyPerkEffects } from "./core/perkEngine.js";

import TaskRow from "./components/TaskRow.jsx";
import MusicTab from "./components/MusicTab.jsx";
import TopTabs from "./components/TopTabs.jsx";
import AppHeader from "./components/AppHeader.jsx";
import AddTaskBar from "./components/AddTaskBar.jsx";
import TopAchievements from "./components/TopAchievements.jsx";
import StoryTab from "./components/StoryTab.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import AchievementsHall from "./components/AchievementsHall.jsx";

import { MusicProvider } from "./ctx/MusicContext.jsx";
import GlobalPlayer from "./components/GlobalPlayer.jsx";

export default function App() {
  const [tab, setTab] = useState("tasks");

  // ===== Persisted =====
  const [lists, setLists] = usePersist("qj_lists", loadLists);
  const [activeListId, setActiveListId] = usePersist("qj_active_list", loadActiveListId);
  const [tasks, setTasks] = usePersist("qj_tasks", () => {
    const arr = loadTasks();
    return arr.map(t => ({ listId: t.listId ?? "inbox", parentId: t.parentId ?? null, ...t }));
  });
  const [xp, setXp] = usePersist("qj_xp", loadXP);
  const [settings, setSettings] = usePersist("qj_settings_v1", () => ({ dark:false, animations:true, sounds:true, skin:"classic" }));
  const [dailyTpl, setDailyTpl] = usePersist("qj_daily_tpl", loadDailyTemplates);
  const [weeklyTpl, setWeeklyTpl] = usePersist("qj_weekly_tpl", loadWeeklyTemplates);
  const [day, setDay] = usePersist("qj_day_state", () => ensureTodayState(loadDailyTemplates()));
  const [week, setWeek] = usePersist("qj_week_state", () => ensureWeekState(loadWeeklyTemplates()));
  const [ach, setAch] = usePersist("qj_ach", loadAchievements);
  const [origin, setOrigin] = usePersist("qj_story_origin", () => "");

  // Signal to refresh profile-driven UIs (Story/Skills)
  const [profileVersion, setProfileVersion] = useState(0);

  // New state for toggling completed tasks section
  const [completedOpen, setCompletedOpen] = useState(true);

  useEffect(() => { migrateProfileFromLegacy(); }, []);

  // mirror core
  useEffect(()=>{ saveLists(lists); },[lists]);
  useEffect(()=>{ saveActiveListId(activeListId); },[activeListId]);
  useEffect(()=>{ saveTasks(tasks); },[tasks]);
  useEffect(()=>{ saveXP(xp); },[xp]);
  useEffect(()=>{ saveDailyTemplates(dailyTpl); },[dailyTpl]);
  useEffect(()=>{ saveWeeklyTemplates(weeklyTpl); },[weeklyTpl]);
  useEffect(()=>{ saveTodayState(day); },[day]);
  useEffect(()=>{ saveWeekState(week); },[week]);
  useEffect(()=>{ saveAchievements(ach); },[ach]);
  useEffect(()=>{ try { mergePerksFromAchievements(ach); } catch {} }, [ach]);

  // UI state
  const [floorMsgs, setFloorMsgs] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [text, setText] = useState("");
  const [aiText, setAiText] = useState("");
  const [xpInput, setXpInput] = useState("");      // empty by default so input shows blank
  const [deadlineAmt, setDeadlineAmt] = useState("");
  const [deadlineUnit, setDeadlineUnit] = useState("h");
  const [absoluteDue, setAbsoluteDue] = useState(null);
  const [desc, setDesc] = useState("");
  const [recur, setRecur] = useState("none");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const now = useTick(1000);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.skin = settings.skin || "classic";
    if (settings.dark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [settings.dark, settings.skin]);

  // Level/Progress (legacy global XP)
  const { level, into, span, nextIn } = useMemo(() => levelProgress(xp), [xp]);
  const progressPct = Math.min(100, (into / Math.max(1, span)) * 100);

  // Celebrate
  const prevLevelRef = useRef(level);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!settings.animations) return;
    if (level > prevLevelRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1500);
      prevLevelRef.current = level;
      return () => clearTimeout(t);
    }
    prevLevelRef.current = level;
  }, [level, settings.animations]);

  // Derived
  const childrenOf = (id) => tasks.filter(t => t.parentId === id);
  const rootsOpen = useMemo(
    () => tasks.filter(t => !t.parentId && t.listId === activeListId && !t.done),
    [tasks, activeListId]
  );
  const rootsDone = useMemo(
    () => tasks.filter(t => !t.parentId && t.listId === activeListId && t.done),
    [tasks, activeListId]
  );

  const completedToday = useMemo(
    () => tasks.filter(t => t.done && (t.createdAt || "").slice(0,10) === todayStr()).length,
    [tasks]
  );

  // Achievements (derive & persist + award global & multi-XP)
  useEffect(() => {
    const ctx = { tasks, level };
    const next = evaluateAchievements(
      ctx,
      ach,
      (payload) => {
        try {
          const globalDelta = Number(payload?.global || 0);
          const multi = payload?.multi && typeof payload.multi === "object" ? payload.multi : null;
          const reason = payload?.reason || "Achievement";

          if (globalDelta) setXp(prev => prev + globalDelta);

          if (multi && Object.keys(multi).length) {
            const pseudo = {
              id: `ach_${Date.now()}`,
              title: reason,
              baseXp: 0,
              xpAwards: multi,
            };
            awardXPForTask(pseudo, () => {});
            setProfileVersion(v => v + 1);
          }
        } catch (e) {
          console.warn("Achievement awardFn failed:", e);
        }
      }
    );
    if (next !== ach) setAch(next);
    // eslint-disable-next-line
  }, [tasks, day.completedIds, level]);

  // ===== Actions =====

  // Add task (accepts optional payload from AddTaskBar: { baseXp, xpAwards } OR { aiInput })
  function addTask(payload = {}) {
    const title = (text || aiText).trim(); if (!title) return;
    const baseXp   = Math.max(1, parseInt(payload.baseXp ?? xpInput ?? 1, 10) || 1);
    const xpAwards = (payload.xpAwards && typeof payload.xpAwards === "object") ? payload.xpAwards : {};
    setTasks(p => [{
      id: uid(),
      title,
      desc: (desc || "").trim() || undefined,
      recur,
      xp: baseXp,             // legacy
      baseXp,                 // multi-XP support
      xpAwards,               // multi-XP support
      done: false,
      createdAt: new Date().toISOString(),
      deadline: computeDeadlineISO({ absoluteDue, deadlineAmt, deadlineUnit, now: Date.now() }),
      parentId: null,
      listId: activeListId
    }, ...p]);

    setText(""); setAiText("");
    setXpInput("");                            // back to empty
    setDeadlineAmt(""); setDeadlineUnit("h"); setAbsoluteDue(null);
    setDesc(""); setRecur("none");
  }

  function onAddSubtask(parentId, title, subXP, after) {
    const t = (title || "").trim(); if (!t) return;
    setTasks(p => [{
      id: uid(), title: t,
      xp: Math.max(1, parseInt(subXP || 1, 10)),
      done: false, createdAt: new Date().toISOString(),
      deadline: null, parentId, listId: activeListId
    }, ...p]);
    after && after();
  }

  // Apply perk effects + award XP + unlock new perks (toast) + signal profile refresh
  function awardWithPerks(taskForAward) {
    const prof = loadProfile();
    const owned = prof?.perks?.owned || [];

    const rawAwards = taskForAward?.xpAwards && typeof taskForAward.xpAwards === "object" ? taskForAward.xpAwards : {};
    const effAwards = applyPerkEffects(rawAwards, owned);

    const enriched = { ...taskForAward, xpAwards: effAwards };
    awardXPForTask(enriched, (delta) => setXp(prev => prev + delta));

    const post = loadProfile();
    const newly = evaluateNewPerks(post, owned, { level });
    if (newly.length) {
      post.perks.owned = [...new Set([...owned, ...newly.map(p => p.id)])];
      saveProfile(post);
      newly.forEach(p => {
        const msgId = uid();
        setFloorMsgs(m => [...m, { id: msgId, text: `🎉 Perk unlocked: ${p.label}!` }]);
        setTimeout(() => setFloorMsgs(m => m.filter(x => x.id !== msgId)), 1800);
      });
      setSymbols(s => [...s.slice(-24), { id: uid(), char: "✨" }]);
    }
    // notify profile-driven UIs to refresh (Story/SkillForest) — single bump
    setProfileVersion(v => v + 1);
  }

  function toggleTask(id) {
    const current = tasks.find(x => x.id === id);
    const turningDone = current && !current.done;

    setTasks(p => p.map(t => (t.id === id ? { ...t, done: !t.done, ...(t.done ? {} : { deadline: null }) } : t)));

    if (turningDone && current) {
      awardWithPerks(current);

      const msgId = uid();
      setFloorMsgs(m => [...m, { id: msgId, text: PRAISES[Math.floor(Math.random()*PRAISES.length)] }]);
      setTimeout(() => setFloorMsgs(m => m.filter(x => x.id !== msgId)), 1500);
      setSymbols(s => [...s.slice(-24), { id: uid(), char: SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)] }]);

      if (current.recur && current.recur !== "none") {
        const nd = nextDeadline(current);
        setTasks(p => [{
          id: uid(),
          title: current.title,
          desc: current.desc,
          recur: current.recur,
          xp: current.baseXp ?? current.xp ?? 1,
          baseXp: current.baseXp ?? current.xp ?? 1,
          xpAwards: current.xpAwards || {},
          done: false,
          createdAt: new Date().toISOString(),
          deadline: nd,
          parentId: null,
          listId: current.listId || activeListId
        }, ...p]);
      }
    }
  }

  function removeTask(id) {
    const rm = new Set([id]); const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      tasks.forEach(t => { if (t.parentId === cur) { rm.add(t.id); stack.push(t.id); } });
    }
    setTasks(p => p.filter(t => !rm.has(t.id)));
  }

  const clearCompleted = () =>
    setTasks(p => p.filter(t => !(t.done && t.listId === activeListId && !t.parentId)));

  function toggleDaily(tplId) {
    const already = day.completedIds.includes(tplId);
    setDay(st => ({ ...st, completedIds: already ? st.completedIds.filter(i => i !== tplId) : [...st.completedIds, tplId] }));
    if (!already) setXp(x => x + (dailyTpl.find(t => t.id === tplId)?.xp ?? DEFAULT_DAILY_XP));
  }

  function toggleWeekly(tplId) {
    const already = week.completedIds.includes(tplId);
    setWeek(st => ({ ...st, completedIds: already ? st.completedIds.filter(i => i !== tplId) : [...st.completedIds, tplId] }));
    if (!already) setXp(x => x + (weeklyTpl.find(t => t.id === tplId)?.xp ?? DEFAULT_WEEKLY_XP));
  }

  return (
    <MusicProvider>
      <GlobalPlayer />
      <div className="app-root">
        <div className="symbols">{symbols.map(s => <span key={s.id}>{s.char}</span>)}</div>
        {floorMsgs.map(m => <div key={m.id} className="toast">{m.text}</div>)}

        <TopTabs tab={tab} setTab={setTab} />

        {tab === "tasks" && (
          <div className="card">
            <div>
              <AppHeader
                xp={xp} level={level} into={into} span={span} nextIn={nextIn}
                progressPct={progressPct} ach={ach} celebrate={celebrate}
                onOpenSettings={()=> setSettingsOpen(true)}
                origin={origin}
              />

              {/* نمایش ۵ تا از بالاترین اچیومنت‌ها */}
              <TopAchievements ach={ach} />

              {/* Lists */}
              <section style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16, marginBottom:8, gap:8, flexWrap:"wrap" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {lists.map(l => (
                    <button key={l.id} className={`btn ${l.id===activeListId?"active":""}`}
                            onClick={() => setActiveListId(l.id)}>{l.name}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn" onClick={() => { const name = prompt("New list name:"); if (name) {
                    const id = uid(); setLists(p => [...p, { id, name }]); setActiveListId(id);
                  } }}>+ New list</button>
                  <button className="btn" onClick={() => {
                    const l = lists.find(x => x.id === activeListId); if (!l) return;
                    const name = prompt("Rename list:", l.name);
                    if (name && name !== l.name) setLists(p => p.map(it => it.id===l.id ? { ...it, name } : it));
                  }}>Rename</button>
                  {activeListId !== "inbox" && (
                    <button className="btn" onClick={() => { if (confirm("Delete this list and all its tasks?")) {
                      setLists(p => p.filter(l => l.id !== activeListId));
                      setTasks(p => p.filter(t => t.listId !== activeListId));
                      setActiveListId("inbox");
                    } }}>
                      Delete
                    </button>
                  )}
                </div>
              </section>

              {/* Add task */}
              <AddTaskBar
                text={text} setText={setText}
                aiText={aiText} setAiText={setAiText}
                xpInput={xpInput} setXpInput={setXpInput}
                deadlineAmt={deadlineAmt} setDeadlineAmt={setDeadlineAmt}
                deadlineUnit={deadlineUnit} setDeadlineUnit={setDeadlineUnit}
                setAbsoluteDue={setAbsoluteDue}
                desc={desc} setDesc={setDesc}
                recur={recur} setRecur={setRecur}
                onAdd={addTask}   // accepts { baseXp, xpAwards } from modal/alloc
                 level={level}
              />

              {/* Counters */}
              <section className="metaRow">
                <div>Open: <b className="mono">{rootsOpen.length}</b> • Completed: <span className="mono">{rootsDone.length}</span></div>
                <div className="actions"><button className="btn" onClick={() => setTasks(p => p.filter(t => !(t.done && t.listId === activeListId && !t.parentId)))} disabled={rootsDone.length===0}>Clear completed</button></div>
              </section>

              {/* Open tasks */}
              <section className="list">
                {rootsOpen.length===0 && <div className="empty">No tasks yet — add one to earn XP!</div>}
                {rootsOpen.map(t => (
                  <TaskRow key={t.id} t={t} childrenOf={childrenOf}
                           onToggle={toggleTask} onRemove={(id)=>setTasks(p=>p.filter(x=>x.id!==id))}
                           onAddSubtask={onAddSubtask} timeLeft={(iso)=>timeLeft(iso, now)}/>
                ))}
              </section>

              {/* Completed */}
              <section className="list" style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, marginBottom: 8 }}>✅ Completed</h3>
                  <button
                    className="btn"
                    onClick={() => setCompletedOpen(v => !v)}
                    style={{ padding: "4px 8px" }}
                  >
                    {completedOpen ? "Collapse" : "Expand"}
                  </button>
                </div>
                {completedOpen && rootsDone.length === 0 && <div className="empty">Nothing here yet.</div>}
                {completedOpen && rootsDone.map(t => (
                  <TaskRow key={t.id} t={t} childrenOf={childrenOf}
                           onToggle={toggleTask} onRemove={(id)=>setTasks(p=>p.filter(x=>x.id!==id))}
                           onAddSubtask={onAddSubtask} timeLeft={(iso)=>timeLeft(iso, now)}/>
                ))}
              </section>

              {/* Daily & Weekly */}
              <section style={{ marginTop: 24 }}>
                <h3 style={{ margin: 0, marginBottom: 8 }}>⚔️ Today’s Challenges <span className="hint">(2 random)</span></h3>
                <div className="list">
                  {day.picks.length===0 && <div className="empty">No templates — add some in settings.</div>}
                  {day.picks.map(pid => {
                    const tpl = dailyTpl.find(t => t.id===pid); if (!tpl) return null;
                    const done = day.completedIds.includes(pid);
                    return (
                      <div key={pid} className={`task ${done ? "done" : ""}`}>
                        <input type="checkbox" checked={done} onChange={()=>toggleDaily(pid)} />
                        <div className="title">{tpl.title}</div>
                        <div className="xp mono">{tpl.xp ?? DEFAULT_DAILY_XP} XP</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section style={{ marginTop: 16 }}>
                <h3 style={{ margin: 0, marginBottom: 8 }}>🔥 Weekly Challenges <span className="hint">({weekKeyOf()})</span></h3>
                <div className="list">
                  {week.picks.length===0 && <div className="empty">No templates — add some in settings.</div>}
                  {week.picks.map(pid => {
                    const tpl = weeklyTpl.find(t => t.id===pid); if (!tpl) return null;
                    const done = week.completedIds.includes(pid);
                    return (
                      <div key={pid} className={`task ${done ? "done" : ""}`}>
                        <input type="checkbox" checked={done} onChange={()=>toggleWeekly(pid)} />
                        <div className="title">{tpl.title}</div>
                        <div className="xp mono">{tpl.xp ?? DEFAULT_WEEKLY_XP} XP</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === "music" && <MusicTab/>}

        {tab === "story" && (
          <StoryTab
            level={level}
            tasks={tasks}
            origin={origin}
            setOrigin={setOrigin}
            profileVersion={profileVersion}
          />
        )}
        {tab === "journal" && <JournalTab />}

        {tab === "ach" && <AchievementsHall ach={ach} />}

      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={()=> setSettingsOpen(false)}
        settings={settings} setSettings={setSettings}
        dailyTpl={dailyTpl} setDailyTpl={setDailyTpl}
        weeklyTpl={weeklyTpl} setWeeklyTpl={setWeeklyTpl}
      />
    </MusicProvider>
  );
}