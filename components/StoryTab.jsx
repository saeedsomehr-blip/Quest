import React, { useEffect, useMemo, useState } from "react";
import { todayStr } from "../core/challenges.js";
import SkillForest from "./SkillForest.jsx";

/**
 * StoryTab
 * - Main: Origin (top center, edit-in-place)
 * - Sidebar: Chronicles (collapsed to right)
 * - Bottom: SkillForest
 * - profileVersion: whenever XP/perks change, App bumps this so SkillForest refreshes.
 */
export default function StoryTab({ level, tasks, origin, setOrigin, profileVersion }) {
  // Origin editor state
  const [draft, setDraft] = useState(origin || "");
  const [editing, setEditing] = useState(false);

  // Keep draft synced with external origin changes
  useEffect(() => {
    setDraft(origin || "");
  }, [origin]);

  // Recent completed tasks (latest 8, most recent first)
  const recentDone = useMemo(() => {
    const done = tasks.filter(t => t.done);
    done.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return done.slice(0, 8);
  }, [tasks]);

  function handleSave() {
    const v = (draft || "").trim();
    setOrigin(v);
    setEditing(false); // collapse after save
  }
  function handleCancel() {
    setDraft(origin || "");
    setEditing(false);
  }

  // Simple responsive breakpoint
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const gridDesktop = {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.9fr",
    gap: 16,
  };
  const gridMobile = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  };

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      {/* Two-column layout */}
      <section style={isNarrow ? gridMobile : gridDesktop}>
        {/* MAIN COLUMN — Origin (moved to top center) */}
        <div className="sf-card" style={{ borderRadius: 16 }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Origin</h3>
            {!editing ? (
              <button className="btn" onClick={() => setEditing(true)}>Edit</button>
            ) : null}
          </header>

          {/* Read mode */}
          {!editing && (
            <div style={{ display: "grid", gap: 8 }}>
              {origin ? (
                <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{origin}</div>
              ) : (
                <div className="hint">
                  No origin set yet. Click “Edit” to write your backstory.
                </div>
              )}
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <div style={{ display: "grid", gap: 8 }}>
              <textarea
                rows={8}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Who are you? What's your quest?"
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn" onClick={handleCancel}>Cancel</button>
                <button className="btn primary" onClick={handleSave}>Save</button>
              </div>
              <div className="hint">
                Saved origin appears here, stays compact, and won’t take over the page.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Chronicles (moved to sidebar) */}
        <aside className="sf-card" style={{ borderRadius: 16, position: "relative" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Chronicles</h3>
            <span className="hint">Your latest completed quests</span>
          </header>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Level: {level}</div>
            {recentDone.length === 0 ? (
              <div className="empty">
                No adventures written yet — complete a quest to start your chronicles.
              </div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 6 }}>
                {recentDone.map(t => (
                  <li key={t.id} style={{ lineHeight: 1.35 }}>
                    <span style={{ fontWeight: 600 }}>{t.title}</span>{" "}
                    <span className="hint">• {new Date(t.createdAt).toLocaleString()}</span>
                    {t.desc ? (
                      <div className="hint" style={{ marginTop: 2, overflowWrap: "anywhere" }}>
                        {t.desc}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      {/* Skill Forest (unchanged) */}
      <SkillForest key={profileVersion ?? "skillforest"} profileVersion={profileVersion} />
    </div>
  );
}