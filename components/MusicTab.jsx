// src/components/MusicTab.jsx
import React, { useState } from "react";
import { useMusic } from "../ctx/MusicContext";
import { addYouTubeToQueue } from "./GlobalPlayer";

export default function MusicTab() {
  const m = useMusic();
  const [link, setLink] = useState("");

  function onAddLink() {
    const raw = (link || "").trim();
    if (!raw) return;
    const ok = addYouTubeToQueue(raw, m);
    if (!ok) alert("Unsupported/invalid YouTube link.");
    else setLink("");
  }

  function onPickFiles(e) {
    const files = e.target.files;
    if (files?.length) m.addFiles(files);
    e.target.value = "";
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop:0 }}>🎵 Music</h2>

      <section style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Queue</h3>
        <ul style={{ marginTop: 8, paddingLeft: 0 }}>
          {m.queue.length === 0 && <div className="hint">Empty queue.</div>}
          {m.queue.map((it, i) => (
            <li key={it.id} style={{ listStyle:"none", display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <button className="btn" onClick={() => m.jump(i)} style={{ padding:"4px 8px" }}>
                {i === m.index ? "▶" : i+1}
              </button>
              <span style={{ fontSize:14, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {it.title} <span className="hint">({it.type})</span>
              </span>
              <button className="btn" onClick={() => m.removeAt(i)}>✕</button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display:"grid", gap:10 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <input
            style={{ flex:1, minWidth:260 }}
            placeholder="Paste YouTube video/playlist link…"
            value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onAddLink()}
          />
          <button className="btn" onClick={onAddLink}>Add link</button>
        </div>

        <div>
          <label className="hint">Add local audio files</label><br/>
          <input type="file" accept="audio/*" multiple onChange={onPickFiles} />
          <div className="hint" style={{ marginTop:6 }}>
            Local files persist for this session.
          </div>
        </div>
      </section>
    </div>
  );
}
