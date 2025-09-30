// src/components/SettingsModal.jsx
import React, { useState } from "react";
import ChallengeManager from "./ChallengeManager.jsx";
import AiConnect from "./AiConnect.jsx";
import { uid } from "../utils/constants.js";

export default function SettingsModal({
  open,
  onClose,
  settings,
  setSettings,
  dailyTpl,
  setDailyTpl,
  weeklyTpl,
  setWeeklyTpl,
}) {
  // appearance | challenges | ai | about
  const [section, setSection] = useState("appearance");

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Settings</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${section === "appearance" ? "active" : ""}`}
            onClick={() => setSection("appearance")}
          >
            Mode
          </button>
          <button
            className={`tab ${section === "challenges" ? "active" : ""}`}
            onClick={() => setSection("challenges")}
          >
            Manage Challenges
          </button>
          <button
            className={`tab ${section === "ai" ? "active" : ""}`}
            onClick={() => setSection("ai")}
          >
            AI
          </button>
          <button
            className={`tab ${section === "about" ? "active" : ""}`}
            onClick={() => setSection("about")}
          >
            About
          </button>
        </div>

        {/* Appearance */}
        {section === "appearance" && (
          <div className="modal-body">
            <label className="row-sb">
              <span>Dark mode</span>
              <input
                type="checkbox"
                checked={!!settings.dark}
                onChange={(e) => setSettings((s) => ({ ...s, dark: e.target.checked }))}
              />
            </label>

            <label className="row-sb">
              <span>Celebration animations</span>
              <input
                type="checkbox"
                checked={!!settings.animations}
                onChange={(e) => setSettings((s) => ({ ...s, animations: e.target.checked }))}
              />
            </label>

            <label className="row-sb">
              <span>Sounds</span>
              <input
                type="checkbox"
                checked={!!settings.sounds}
                onChange={(e) => setSettings((s) => ({ ...s, sounds: e.target.checked }))}
              />
            </label>

            <hr />

            <div>
              <div className="hint" style={{ marginBottom: 8 }}>
                World Skin (early draft)
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["classic", "misty", "desert", "forest"].map((m) => (
                  <button
                    key={m}
                    className={`btn ${settings.skin === m ? "primary" : ""}`}
                    onClick={() => setSettings((s) => ({ ...s, skin: m }))}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Challenges */}
        {section === "challenges" && (
          <div className="modal-body" style={{ display: "grid", gap: 12 }}>
            <h4>Daily templates</h4>
            <ChallengeManager
              label="Daily"
              templates={dailyTpl}
              defaultXP={250}
              onAdd={(title, xp) => setDailyTpl((p) => [{ id: uid(), title, xp }, ...p])}
              onRemove={(id) => setDailyTpl((p) => p.filter((t) => t.id !== id))}
            />

            <h4 style={{ marginTop: 16 }}>Weekly templates</h4>
            <ChallengeManager
              label="Weekly"
              templates={weeklyTpl}
              defaultXP={500}
              onAdd={(title, xp) => setWeeklyTpl((p) => [{ id: uid(), title, xp }, ...p])}
              onRemove={(id) => setWeeklyTpl((p) => p.filter((t) => t.id !== id))}
            />
          </div>
        )}

        {/* AI (moved here from the top-level tab) */}
        {section === "ai" && (
          <div className="modal-body">
            <AiConnect />
          </div>
        )}

        {/* About */}
        {section === "about" && (
          <div className="modal-body">
            <div className="hint">
              Quest Journal — lightweight, local-first. Built with React + Vite.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
