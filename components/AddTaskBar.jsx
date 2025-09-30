// src/components/AddTaskBar.jsx
// Adds "primary branch" tag when any branch has ≥50% of allocated XP.
// Keeps all previous features (Due/Repeat, AI, suggestXP/band20, clamp, ...)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { epicifyTask } from "../utils/ai.js";
import { XP_TYPES, XP_META, loadMultiXP, computeBuffBreakdown } from "../core/multixp.js";
import { suggestXP, band20 } from "../core/xpSuggest.js";

/** Sum helper (string or number entries) */
function sumMapValues(obj) {
  return Object.values(obj || {}).reduce((acc, v) => {
    const n = parseInt(v, 10);
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

/** Clamp allocation so that total never exceeds base */
function clampAllocation(nextMap, key, base) {
  const total = sumMapValues(nextMap);
  if (total <= base) return nextMap;
  const cur = parseInt(nextMap[key] || 0, 10) || 0;
  const over = total - base;
  const newVal = Math.max(0, cur - over);
  return { ...nextMap, [key]: newVal ? String(newVal) : "" };
}

/** Compute primary branch by ≥50% rule */
function primaryBranchOf(allocMap) {
  const total = sumMapValues(allocMap);
  if (total <= 0) return null;
  let best = null, bestVal = 0;
  for (const k of XP_TYPES) {
    const v = parseInt(allocMap?.[k] || 0, 10) || 0;
    if (v > bestVal) { bestVal = v; best = k; }
  }
  return bestVal / total >= 0.5 ? best : null;
}

export default function AddTaskBar({
  text, setText,
  aiText, setAiText,
  xpInput, setXpInput,             // Base XP (set only via wizard)
  deadlineAmt, setDeadlineAmt,
  deadlineUnit, setDeadlineUnit,
  setAbsoluteDue,
  desc, setDesc,
  recur, setRecur,
  onAdd,
  level = 1,
}) {
  const titleRef = useRef(null);

  // Popovers
  const [showDue, setShowDue] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const wrapRef = useRef(null);

  // XP Wizard + Allocation
  const [xpWizardOpen, setXpWizardOpen] = useState(false);
  const [xpBand, setXpBand] = useState(null); // {min,max} یا null

  const [allocOpen, setAllocOpen] = useState(false);
  const [alloc, setAlloc] = useState({}); // { WISDOM: "3", STRENGTH: "" ... }

  // Buffs (for (+Δ) visuals)
  const [buffs, setBuffs] = useState(() => computeBuffBreakdown(loadMultiXP()));
  useEffect(() => {
    const id = setInterval(() => setBuffs(computeBuffBreakdown(loadMultiXP())), 1500);
    return () => clearInterval(id);
  }, []);

  // click-outside closes popovers
  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setShowDue(false);
        setShowRepeat(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const safeBase = !xpInput ? 1 : Math.max(1, parseInt(xpInput, 10) || 1);
  const totalAlloc = sumMapValues(alloc);
  const remaining = Math.max(0, safeBase - totalAlloc);

  async function handleAI() {
    const title = (text || "").trim();
    if (!title) { titleRef.current?.focus(); return; }
    try {
      const story = await epicifyTask(title, desc);
      setDesc(story);
      setAiText?.(story);
    } catch (e) {
      alert("AI failed: " + e.message);
    }
  }

  function handleAdd() {
    const title = (text || aiText).trim();
    if (!title) { titleRef.current?.focus(); return; }

    // Build xpAwards map from non-zero allocations
    const xpAwards = {};
    for (const t of XP_TYPES) {
      const v = parseInt(alloc[t] || 0, 10);
      if (Number.isFinite(v) && v > 0) xpAwards[t] = v;
    }

    // Compute primary branch by ≥50% rule (store for UI/history; award.js هم خودش دوباره محاسبه می‌کند)
    const primary = primaryBranchOf(xpAwards) || undefined;

    onAdd?.({
      baseXp: Math.max(1, parseInt(xpInput || 1, 10)),
      xpAwards,
      primaryBranch: primary,
    });

    // reset
    setShowDue(false); setShowRepeat(false); setAllocOpen(false); setXpBand(null);
  }

  function updateAlloc(t, raw) {
    const base = !xpInput ? 1 : Math.max(1, parseInt(xpInput, 10) || 1);
    let val = raw === "" ? "" : String(Math.max(0, parseInt(raw, 10) || 0));
    const next = { ...alloc, [t]: val };
    const clamped = clampAllocation(next, t, base);
    setAlloc(clamped);
  }

  function clearAllocAll() { setAlloc({}); }
  function fillEven() {
    const base = !xpInput ? 1 : Math.max(1, parseInt(xpInput, 10) || 1);
    const per = Math.max(0, Math.floor(base / XP_TYPES.length));
    const rest = Math.max(0, base - per * XP_TYPES.length);
    const next = Object.fromEntries(XP_TYPES.map((t, i) => [t, String(per + (i < rest ? 1 : 0))]));
    setAlloc(next);
  }

  // ── Branch-only preview: final = raw + (+Δbranch)
  const branchPreview = useMemo(() => {
    const out = {};
    XP_TYPES.forEach((t) => {
      const raw = parseInt(alloc[t], 10) || 0;
      const m = buffs?.branchMul?.[t] || 1;
      const delta = raw > 0 ? Math.round(raw * (m - 1)) : 0;
      out[t] = { raw, delta, final: raw + delta, mult: m };
    });
    return out;
  }, [alloc, buffs]);

  const totalsPreview = useMemo(() => {
    const raw = XP_TYPES.reduce((s, t) => s + (branchPreview[t].raw || 0), 0);
    const delta = XP_TYPES.reduce((s, t) => s + (branchPreview[t].delta || 0), 0);
    return { raw, delta, final: raw + delta };
  }, [branchPreview]);

  // شاخهٔ غالب فعلی (برای نمایش تگ بالای Allocate)
  const currentPrimary = primaryBranchOf(alloc);

  return (
    <section className="add" style={{ display: "grid", gap: 10 }} ref={wrapRef}>
      {/* Row 1: title + XP wizard button + Due/Repeat + actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          ref={titleRef}
          type="text"
          className="titleInput"
          placeholder="Task title…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* XP display + open wizard */}
        <div className="xpGroup" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="xpLabel">XP</span>
          <input
            className="xpInput"
            type="number"
            value={xpInput ?? ""}
            placeholder="—"
            readOnly
            title="Select XP via the wizard"
          />
          <button className="btn" onClick={() => setXpWizardOpen(true)} title="Choose XP">XP…</button>
          <button
            className="btn"
            onClick={() => setAllocOpen(true)}
            title="Allocate branches"
            disabled={!xpInput}
          >
            Allocate…
          </button>
        </div>

        {/* Due popover */}
        <div style={{ position: "relative" }}>
          <button className="btn" onClick={() => { setShowDue(v => !v); setShowRepeat(false); }}>
            Due ▾
          </button>
          {showDue && (
            <div
              style={{
                position: "absolute", top: "110%", right: 0, zIndex: 30,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: 10, boxShadow: "0 10px 26px rgba(0,0,0,.12)",
                width: 300, display: "grid", gap: 8
              }}
            >
              <b>Set deadline</b>
              <div className="hint">Relative:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <input
                  className="dueInput"
                  type="number"
                  min={1}
                  value={deadlineAmt}
                  onChange={(e) => {
                    const n = parseInt(e.target.value || 1, 10);
                    setDeadlineAmt(Number.isFinite(n) && n > 0 ? n : 1);
                  }}
                  placeholder="2"
                />
                <select
                  value={deadlineUnit}
                  onChange={(e) => setDeadlineUnit(e.target.value)}
                  className="dueSelect"
                >
                  <option value="min">min</option>
                  <option value="h">h</option>
                  <option value="d">d</option>
                </select>
              </div>

              <div className="hint">Absolute:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  type="date"
                  onChange={(e) => {
                    const d = e.target.value;
                    if (!d) return setAbsoluteDue(null);
                    const iso = new Date(`${d}T23:59:59`).toISOString();
                    setAbsoluteDue(iso);
                  }}
                />
                <input
                  type="time"
                  onChange={(e) => {
                    const t = e.target.value;
                    if (!t) return;
                    const d = new Date();
                    const [H, M] = t.split(":").map((x) => parseInt(x || "0", 10));
                    d.setHours(H); d.setMinutes(M); d.setSeconds(0); d.setMilliseconds(0);
                    setAbsoluteDue(d.toISOString());
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn" onClick={() => setShowDue(false)}>Close</button>
              </div>
            </div>
          )}
        </div>

        {/* Repeat popover */}
        <div style={{ position: "relative" }}>
          <button className="btn" onClick={() => { setShowRepeat(v => !v); setShowDue(false); }}>
            Repeat ▾
          </button>
          {showRepeat && (
            <div
              style={{
                position: "absolute", top: "110%", right: 0, zIndex: 30,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, padding: 10, boxShadow: "0 10px 26px rgba(0,0,0,.12)",
                width: 260, display: "grid", gap: 8
              }}
            >
              <b>Repeat interval</b>
              <select value={recur} onChange={(e) => setRecur(e.target.value)}>
                <option value="none">No repeat</option>
                <option value="daily">Repeat: daily</option>
                <option value="weekly">Repeat: weekly</option>
                <option value="monthly">Repeat: monthly</option>
              </select>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn" onClick={() => setShowRepeat(false)}>Close</button>
              </div>
            </div>
          )}
        </div>

        <button className="btn aiBtn" onClick={handleAI} title="AI story">✨</button>
        <button className="btn addBtn primary" onClick={handleAdd} title="Add this task">🗡️ Add</button>
      </div>

      {/* Description */}
      <div style={{ display: "grid", gap: 6 }}>
        <span className="xpLabel">Description / Story</span>
        <textarea
          rows={3}
          placeholder="Write notes… or click ✨ AI story"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      {/* === XP WIZARD MODAL === */}
      {xpWizardOpen && (
        <div className="modal-backdrop" onClick={() => setXpWizardOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <b>Choose XP</b>
              <button className="icon-btn" onClick={() => setXpWizardOpen(false)}>✕</button>
            </div>

            <XPWizard
              level={level}
              buffs={buffs}
              onCancel={() => setXpWizardOpen(false)}
              onApply={({ xp, band }) => {
                setXpInput(xp);
                setXpBand(band);
                setXpWizardOpen(false);
                setAllocOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* === Allocation Modal === */}
      {allocOpen && (
        <div className="modal-backdrop" onClick={() => setAllocOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ alignItems:"flex-start" }}>
              <div>
                <b>Allocate XP branches</b>
                {/* تگ شاخهٔ غالب با قانون ≥۵۰٪ */}
                {currentPrimary && (
                  <div className="hint" style={{ marginTop:4 }}>
                    <span className="chip" style={{ borderColor: XP_META[currentPrimary]?.color, color: XP_META[currentPrimary]?.color }}>
                      {currentPrimary} task
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={clearAllocAll}>Clear</button>
                <button className="btn" onClick={fillEven}>Even split</button>
                <button className="btn primary" onClick={() => setAllocOpen(false)}>Done</button>
              </div>
            </div>

            {/* Base + allocation status */}
            <div className="row-sb" style={{ marginBottom: 6 }}>
              <span className="hint">Base XP to split</span>
              <span className="mono">{safeBase}</span>
            </div>
            <div className="row-sb" style={{ marginBottom: 12 }}>
              <span className="hint">Allocated</span>
              <span className="mono">{totalAlloc} / {safeBase} (remaining: {remaining})</span>
            </div>

            {/* Branch cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:8 }}>
              {XP_TYPES.map((t) => {
                const color = XP_META[t]?.color || "#4b5563";
                const icon  = XP_META[t]?.icon  || "⭐";
                const val = alloc[t] ?? "";
                const view = branchPreview[t]; // {raw, delta, final, mult}
                return (
                  <div key={t} className="xp-pill" style={{ padding: 8 }}>
                    <span className="xp-ico" style={{ background: color }}>{icon}</span>
                    <div className="xp-info">
                      <div className="xp-name">{t}</div>
                      <div className="xp-meta" style={{ justifyContent:"space-between", alignItems:"center" }}>
                        <span className="hint">Allocated</span>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          {/* (+Δbranch) کوچک کنار ورودی */}
                          {view.delta > 0 ? (
                            <span className="chip mono" title={`branch buff ×${view.mult.toFixed(2)}`}>+{view.delta}</span>
                          ) : null}
                          <input
                            className="xp-chip-input"
                            type="number"
                            min={0}
                            inputMode="numeric"
                            placeholder="0"
                            value={val}
                            onChange={(e) => updateAlloc(t, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
                            }}
                            style={{ width: 80 }}
                          />
                        </div>
                      </div>
                      {/* final branch = raw + (+Δbranch) */}
                      {view.final > 0 ? (
                        <div className="hint mono" style={{ marginTop: 4 }}>
                          → {view.raw} <span style={{ opacity:.7 }}>+{view.delta}</span> = <b>{view.final}</b>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* مجموع شاخه‌ها (فقط branch buffs) */}
            <div className="hint mono" style={{ marginTop: 8, textAlign:"right" }}>
              Allocated sum: {totalsPreview.raw}
              {totalsPreview.delta > 0 ? <> • branch buff: +{totalsPreview.delta} → {totalsPreview.final}</> : null}
            </div>

            <div className="hint" style={{ marginTop: 8 }}>
              The total of branch allocations cannot exceed the Base XP. Unallocated amount remains as global XP only.
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** ---------- XP Wizard component ---------- */
function XPWizard({ level = 1, buffs, onCancel, onApply }) {
  const [difficulty, setDifficulty] = useState(50);
  const [importance, setImportance] = useState(50);
  const [energy, setEnergy] = useState(50);
  const [pride, setPride] = useState(50);
  const [hours, setHours] = useState(1);

  // پیشنهاد زنده (بدون گلوبال)
  const suggested = useMemo(
    () => suggestXP({ hours, difficulty, importance, energy, pride, level }),
    [hours, difficulty, importance, energy, pride, level]
  );
  const range = useMemo(() => band20(suggested), [suggested]);

  // XP انتخابی کاربر داخل باند
  const [chosen, setChosen] = useState(suggested);
  useEffect(() => {
    const { min, max } = range;
    setChosen(prev => Math.min(max, Math.max(min, isFinite(prev) ? prev : suggested)));
  }, [range, suggested]);

  // فقط گلوبال روی کل: (+Δ) کوچک کنار Final XP
  const gMul = buffs?.globalMul || 1;
  const gDelta = Math.max(0, Math.round(chosen * (gMul - 1)));
  const finalTotal = useMemo(() => Math.round((chosen + gDelta) / 5) * 5, [chosen, gDelta]);

  return (
    <div style={{ display:"grid", gap:12 }}>
      <div className="sf-card" style={{ padding:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div>
            <div className="hint">Suggested</div>
            <div style={{ fontSize:22, fontWeight:800 }} className="mono">{suggested}</div>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <div className="hint" style={{ marginBottom:4 }}>
              Pick final XP (±20%): <b className="mono">{range.min}</b> – <b className="mono">{range.max}</b>
            </div>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={5}
              value={chosen}
              onChange={e => setChosen(parseInt(e.target.value, 10))}
              style={{ width:"100%" }}
            />
          </div>
          <div style={{ width:160, textAlign:"right" }}>
            <div className="hint">Final XP</div>
            <div className="mono" style={{ fontSize:20, fontWeight:800 }}>
              {finalTotal} {gDelta > 0 ? <span className="hint" style={{ fontSize:14 }}> (+{gDelta})</span> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:12 }}>
        <QBlock label="How difficult was this task?" value={difficulty} setValue={setDifficulty}/>
        <QBlock label="How important/critical was it?" value={importance} setValue={setImportance}/>
        <QBlock label="How much energy did it take?" value={energy} setValue={setEnergy}/>
        <QBlock label="How proud/satisfied are you with doing it?" value={pride} setValue={setPride}/>
        <div className="sf-card" style={{ padding:12 }}>
          <div className="hint">Hours (can be decimal)</div>
          <input
            type="number" min={0} step={0.25}
            value={hours}
            onChange={e => setHours(Math.max(0, parseFloat(e.target.value || "0")))}
            style={{ width:"100%", margin:"6px 0" }}
          />
          <input
            type="range" min={0} max={12} step={0.25}
            value={Math.min(12, hours)}
            onChange={e => setHours(parseFloat(e.target.value))}
            style={{ width:"100%" }}
          />
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={() => onApply({ xp: finalTotal, band: range })}>
          Continue → Allocate
        </button>
      </div>
    </div>
  );
}

function QBlock({ label, value, setValue }) {
  return (
    <div className="sf-card" style={{ padding:12 }}>
      <div className="hint">{label}</div>
      <input
        type="number" min={1} max={100}
        value={value}
        onChange={e => setValue(Math.max(1, Math.min(100, parseInt(e.target.value || "1", 10))))}
        style={{ width:"100%", margin:"6px 0" }}
      />
      <input
        type="range" min={1} max={100}
        value={value}
        onChange={e => setValue(parseInt(e.target.value, 10))}
        style={{ width:"100%" }}
      />
    </div>
  );
}
