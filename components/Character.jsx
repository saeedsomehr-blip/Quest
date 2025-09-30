import React from "react";
import "./character.css";

function TierBadge({ bg="#e2e8f0", children }) {
  return (
    <div className="char-badge" style={{ background: bg }}>
      <div className="char-glow" />
      <div className="char-emoji">{children}</div>
    </div>
  );
}

export default function Character({ level=1, celebrate=false }) {
  let tier = 1;
  if (level >= 15) tier = 4;
  else if (level >= 10) tier = 3;
  else if (level >= 5) tier = 2;

  // different looks per tier
  const view =
    tier === 1 ? <TierBadge bg="#dbeafe">🧭</TierBadge>       // Novice / Explorer
    : tier === 2 ? <TierBadge bg="#dcfce7">🛡️</TierBadge>    // Adventurer / Shield
    : tier === 3 ? <TierBadge bg="#fde68a">⚔️</TierBadge>    // Knight / Swords
    : <TierBadge bg="#fecaca">🐉</TierBadge>;                 // Legend / Dragon

  return (
    <div className={`char-wrap ${celebrate ? "celebrate" : ""}`}>
      {view}
      {celebrate && (
        <div className="confetti">
          {Array.from({length: 24}).map((_,i)=><span key={i} style={{"--i":i}} />)}
        </div>
      )}
      <div className="char-level">Lv {level}</div>
    </div>
  );
}
