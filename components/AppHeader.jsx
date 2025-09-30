import React from "react";
import Character from "./Character.jsx";
import { ACH_CATALOG as ACH } from "../core/achievements.js"; // اصلاح import
import XPOverview from "./XPOverview.jsx";

export default function AppHeader({
  xp,
  level,
  nextIn,
  progressPct,
  ach,
  celebrate,
  onOpenSettings,
  origin,
}) {
  return (
    <header className="header">
      <div className="header-top">
        <div className="brand-left">
          <Character level={level} celebrate={celebrate} />
          <h1>Quest Journal</h1>
        </div>
        <button className="icon-btn" title="Menu" onClick={onOpenSettings}>⋮</button>
      </div>

      <div className="stats">
        <div className="stat"><div className="label">Legacy XP</div><div className="value mono">{xp}</div></div>
        <div className="stat"><div className="label">Next Level</div><div className="value mono">{nextIn} XP</div></div>
        <div className="stat"><div className="label">Progress</div><div className="value mono">{Math.round(progressPct)}%</div></div>
      </div>
      <progress className="bar" value={progressPct} max="100" />

      {origin && <div className="origin-banner"><strong>Origin:</strong> <span>{origin}</span></div>}
      {celebrate && <div className="toast">🔥✨ LEVEL UP! ✨🔥</div>}

      {ach?.unlocked?.length > 0 && (
        <div className="ach-row">
          {ach.unlocked.map((a) => {
            const achData = ACH.find(item => item.id === a.id) || { label: a.label || a.id, icon: "🏅" };
            return <span className="badge on" key={a.id}>{achData.icon} {achData.label}</span>;
          })}
        </div>
      )}

      {/* NEW: multi-XP overview */}
      <XPOverview />
    </header>
  );
}