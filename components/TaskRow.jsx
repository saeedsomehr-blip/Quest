// src/components/TaskRow.jsx
import { useState } from "react";
import { epicifyTask } from "../utils/ai.js";

export default function TaskRow({
  t,
  childrenOf,
  onToggle,
  onRemove,
  onAddSubtask,
  onUpdate,           // اختیاری
  timeLeft
}) {
  const kids = childrenOf(t.id);
  const [adding, setAdding] = useState(false);
  const [subText, setSubText] = useState("");
  const [subXP, setSubXP] = useState(1);

  // اگر تسک Done است، تایمر را محاسبه نکن
  const deadlineText = t.done ? null : timeLeft(t.deadline);

  async function aiForThis() {
    try {
      const story = await epicifyTask(t.title, t.desc || "");
      onUpdate?.(t.id, { desc: story });
    } catch (e) {
      alert("AI failed: " + e.message);
    }
  }

  const canEdit = !t.done;

  return (
    <div className={`task ${t.done ? "done" : ""}`}>
      <input type="checkbox" checked={t.done} onChange={()=>onToggle(t.id)} />
      <div className="title">
        <div>{t.title}</div>
        {t.desc && <div className="hint" style={{marginTop:4}}>{t.desc}</div>}
        {deadlineText && (
          <div className={`deadline ${deadlineText.startsWith("Overdue")?"overdue":""}`}>
            {deadlineText}
          </div>
        )}
      </div>
      <div className="xp mono">{t.xp} XP</div>

      <div style={{display:"flex", gap:6}}>
        <button className="btn" onClick={aiForThis} title="Generate epic story" disabled={!canEdit}>✨ AI</button>
        <button className="btn" onClick={()=> setAdding(v=>!v)} disabled={!canEdit}>+ Sub</button>
        <button className="btn" onClick={()=> onRemove(t.id)} aria-label="Delete">🗑️</button>
      </div>

      {/* ساب‌تسک‌ اضافه‌کردن فقط وقتی done نیست */}
      {adding && canEdit && (
        <div className="subadd" style={{gridColumn:"1 / -1", display:"flex", gap:8, alignItems:"center", marginTop:8}}>
          <input type="text" placeholder="Subtask title…" value={subText} onChange={e=> setSubText(e.target.value)} />
          <span className="xpLabel">XP</span>
          <input className="xpInput" type="number" min={1} value={subXP} onChange={e=> setSubXP(parseInt(e.target.value||1,10))}/>
          <button
            className="btn"
            onClick={()=>{
              if (!subText.trim()) return;
              onAddSubtask(t.id, subText, subXP, ()=>{ setSubText(""); setSubXP(1); setAdding(false); });
            }}
          >Add</button>
        </div>
      )}

      {/* نمایش ساب‌تسک‌ها */}
      {kids?.length > 0 && (
        <div style={{ gridColumn:"1 / -1", display:"grid", gap:8, marginTop:8 }}>
          {kids.map(c => {
            const childCanEdit = !c.done;
            return (
              <div key={c.id} className={`task ${c.done ? "done" : ""}`} style={{ marginLeft:16 }}>
                <input type="checkbox" checked={c.done} onChange={()=>onToggle(c.id)} />
                <div className="title">
                  <div>{c.title}</div>
                  {c.desc && <div className="hint" style={{marginTop:4}}>{c.desc}</div>}
                </div>
                <div className="xp mono">{c.xp} XP</div>
                <div style={{display:"flex", gap:6}}>
                  <button
                    className="btn"
                    disabled={!childCanEdit}
                    onClick={async()=>{
                      try {
                        const story = await epicifyTask(c.title, c.desc||"");
                        onUpdate?.(c.id, { desc: story });
                      } catch(e){ alert("AI failed: "+e.message); }
                    }}
                  >✨ AI</button>
                  <button className="btn" onClick={()=>onRemove(c.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
