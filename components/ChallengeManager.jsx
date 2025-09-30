import { useState } from "react";

export default function ChallengeManager({ label, templates, onAdd, onRemove, defaultXP = 250 }) {
  const [title, setTitle] = useState("");
  const [xp, setXp] = useState("");

  const add = () => {
    const t = title.trim();
    if (!t) return;
    const n = xp === "" ? undefined : Math.max(0, Math.floor(Number(xp) || 0));
    onAdd(t, n);
    setTitle(""); setXp("");
  };

  return (
    <div style={{border:"1px solid #e5e7eb", borderRadius:12, padding:12, background:"#fff"}}>
      <div style={{marginBottom:8, fontWeight:600}}>
        Manage {label} Templates <span style={{color:"#64748b", fontWeight:400}}>(default XP: {defaultXP})</span>
      </div>
      <div style={{display:"flex", gap:8, marginBottom:10}}>
        <input
          placeholder={`Write a ${label.toLowerCase()} challenge...`}
          value={title}
          onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=> e.key==="Enter" && add()}
          style={{flex:1, height:38, padding:"0 10px", border:"1px solid #e5e7eb", borderRadius:8}}
        />
        <input
          placeholder="XP (optional)"
          value={xp}
          onChange={e=>setXp(e.target.value)}
          onKeyDown={e=> e.key==="Enter" && add()}
          style={{width:120, height:38, padding:"0 10px", border:"1px solid #e5e7eb", borderRadius:8}}
          inputMode="numeric"
        />
        <button className="btn primary" onClick={add}>Add</button>
      </div>
      <div style={{display:"grid", gap:8, maxHeight:220, overflow:"auto"}}>
        {templates.length===0 && <div className="empty" style={{margin:0}}>Nothing yet.</div>}
        {templates.map(t=>(
          <div key={t.id} className="task" style={{gridTemplateColumns:"1fr auto auto"}}>
            <div className="title">{t.title}</div>
            <div className="xp mono">{t.xp ?? defaultXP} XP</div>
            <button className="icon" title="Delete" onClick={()=>onRemove(t.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
