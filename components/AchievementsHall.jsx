// src/components/AchievementsHall.jsx
// Full achievements hall with filters/search/sort/grouping
// + Buff badge (perk effect) shown on each achievement card.

import React, { useMemo, useState } from "react";
import { ACH_CATALOG } from "../core/achievements.js";
import { PERK_RULES } from "../core/perkRules.data.js";
import { loadMultiXP, XP_META } from "../core/multixp.js";

/**
 * ورودی:
 * ach = {
 *   unlocked: [ { id, label, tier, icon, type, gainedAt, description } ],
 *   all?:      [ { id, label, tier, icon, type, unlocked, gainedAt, description } ]
 * }
 * - اگر all نداشته باشی، از ACH_CATALOG به‌عنوان کاتالوگ استفاده می‌کنیم
 * - گزینه‌ی «Show locked» قفل‌ها را هم (به‌صورت کم‌رنگ) نشان می‌دهد
 */

const TYPE_LABEL = {
  productivity: "Productivity",
  social: "Social",
  learning: "Learning",
  health: "Health",
  weekly: "Weekly",
  evergreen: "All-Time",
  time: "Time-of-Day",
  meta: "Meta",
};

// ---------- Buff helpers ----------
function getPerkRuleForAch(achId) {
  return PERK_RULES.find((r) => r.source?.type === "ach" && r.source.achId === achId);
}

function formatBuffFromRule(rule, achItem, perkTiers) {
  if (!rule) return null;

  // ثابت‌ها (effects)
  if (rule.effects) {
    if (typeof rule.effects.globalMult === "number") {
      const pct = Math.round((rule.effects.globalMult - 1) * 100);
      return { label: `+${pct}% Global` };
    }
    if (rule.effects.branchMult) {
      const [br, m] = Object.entries(rule.effects.branchMult)[0] || [];
      if (br && typeof m === "number") {
        const pct = Math.round((m - 1) * 100);
        return { label: `+${pct}% ${br}`, branch: br, color: XP_META?.[br]?.color };
      }
    }
  }

  // tiered
  if (rule.tiered) {
    const tier = Math.max(1, perkTiers?.[rule.id] || achItem?.tier || 1);
    const base = rule.tiered.baseMult || 1.0;
    const step = rule.tiered.perTier || 0.0;
    const mult = base * (1 + (tier - 1) * step);
    const pct = Math.round((mult - 1) * 100);
    if (rule.tiered.branch) {
      const br = rule.tiered.branch;
      return {
        label: `+${pct}% ${br} (T${tier})`,
        branch: br,
        color: XP_META?.[br]?.color,
      };
    } else {
      return { label: `+${pct}% Global (T${tier})` };
    }
  }

  return null;
}

function usePerkTiers() {
  const multi = loadMultiXP();
  return multi?.perkTiers || {};
}

// ---------- Card ----------
function AchCard({ a, buff }) {
  const locked = a.unlocked === false;

  const chipStyle = buff?.color
    ? {
        borderColor: buff.color,
        color: buff.color,
      }
    : {};

  return (
    <div
      className="ach-card"
      title={`${a.label}${a.tier ? ` (Tier ${a.tier})` : ""}${locked ? " • Locked" : ""}`}
      style={{
        display: "grid",
        gap: 8,
        padding: 12,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--card)",
        boxShadow: "0 4px 10px rgba(0,0,0,.06)",
        opacity: locked ? 0.55 : 1,
        position: "relative",
      }}
    >
      {locked && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          Locked
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "var(--btn-hover)",
            fontSize: 18,
          }}
        >
          {a.icon || "🏆"}
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.1 }}>
            {a.label}
            {a.tier ? <span className="hint"> • Tier {a.tier}</span> : null}
          </div>
          <div className="hint" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span>{TYPE_LABEL[a.type] || "General"}</span>
            {!locked && a.gainedAt ? <span>• {new Date(a.gainedAt).toLocaleString()}</span> : null}
          </div>
        </div>
      </div>

      {/* توضیح کوتاه زیر کارت */}
      {a.description ? (
        <div className="hint" style={{ marginTop: 2, lineHeight: 1.35 }}>
          {a.description}
        </div>
      ) : null}

      {/* Buff chip */}
      {buff ? (
        <div style={{ marginTop: 4 }}>
          <span className="chip" style={chipStyle}>
            {buff.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Main ----------
export default function AchievementsHall({ ach }) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all|productivity|social|learning|health|weekly|evergreen|time|meta
  const [sortBy, setSortBy] = useState("tier"); // tier|recent|alpha
  const [showLocked, setShowLocked] = useState(false);

  const perkTiers = usePerkTiers();

  // 1) داده‌ها
  const unlocked = Array.isArray(ach?.unlocked) ? ach.unlocked : [];

  // اگر ach.all نداشتیم، از کاتالوگ پایه بساز و وضعیت unlock را طبق unlocked فعلی تعیین کن
  const catalog = useMemo(() => {
    if (Array.isArray(ach?.all)) return ach.all;
    const setUnlocked = new Set(unlocked.map((a) => a.id));
    return ACH_CATALOG.map((a) => ({
      id: a.id,
      label: a.label,
      tier: a.tier,
      icon: a.icon,
      type: a.type,
      description: a.description,
      unlocked: setUnlocked.has(a.id),
      // اگر نسخه unlock شده موجود است، زمان و … را از آن بردار
      ...(unlocked.find((u) => u.id === a.id) || {}),
    }));
  }, [ach?.all, unlocked]);

  // 2) مرج (اگر ach.all داشتیم هم با unlocked به‌روز می‌کنیم)
  const merged = useMemo(() => {
    const map = new Map();
    for (const a of catalog) map.set(a.id, { ...a, unlocked: !!a.unlocked });
    for (const a of unlocked) {
      const prev = map.get(a.id);
      if (!prev || (a?.tier || 0) >= (prev?.tier || 0)) {
        map.set(a.id, { ...prev, ...a, unlocked: true });
      } else {
        map.set(a.id, { ...prev, unlocked: true, gainedAt: prev.gainedAt || a.gainedAt });
      }
    }
    return [...map.values()];
  }, [catalog, unlocked]);

  // 2.5) محاسبهٔ buff برای هر آیتم (بر اساس PERK_RULES + perkTiers)
  const mergedWithBuff = useMemo(() => {
    return merged.map((a) => {
      const rule = getPerkRuleForAch(a.id);
      const buff = formatBuffFromRule(rule, a, perkTiers);
      return { ...a, __buff: buff };
    });
  }, [merged, perkTiers]);

  // 3) فیلترها و سرچ
  const visible = useMemo(() => {
    let list = mergedWithBuff;
    if (!showLocked) list = list.filter((a) => a.unlocked);
    if (typeFilter !== "all") list = list.filter((a) => (a.type || "evergreen") === typeFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.label || "").toLowerCase().includes(s) ||
          (a.description || "").toLowerCase().includes(s)
      );
    }
    // مرتب‌سازی
    list = [...list].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.gainedAt || 0).getTime() - new Date(a.gainedAt || 0).getTime()
          );
        case "alpha":
          return (a.label || "").localeCompare(b.label || "");
        case "tier":
        default:
          return (b.tier || 0) - (a.tier || 0);
      }
    });
    return list;
  }, [mergedWithBuff, showLocked, typeFilter, q, sortBy]);

  // 4) گروه‌بندی
  const groups = useMemo(() => {
    const bucket = new Map();
    visible.forEach((a) => {
      const t = a.type || "evergreen";
      if (!bucket.has(t)) bucket.set(t, []);
      bucket.get(t).push(a);
    });
    const order = [
      "productivity",
      "social",
      "learning",
      "health",
      "weekly",
      "evergreen",
      "time",
      "meta",
    ];
    const entries = [...bucket.entries()];
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    return entries;
  }, [visible]);

  const totalUnlocked = unlocked.length;
  const totalAll = catalog.length;

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      {/* Header + Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <h2 style={{ margin: 0 }}>Achievements Hall</h2>
          <div className="hint">
            {totalUnlocked} unlocked / {totalAll} total
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search trophies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="productivity">Productivity</option>
            <option value="social">Social</option>
            <option value="learning">Learning</option>
            <option value="health">Health</option>
            <option value="weekly">Weekly</option>
            <option value="evergreen">All-Time</option>
            <option value="time">Time-of-Day</option>
            <option value="meta">Meta</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="tier">Sort: Tier</option>
            <option value="recent">Sort: Recent</option>
            <option value="alpha">Sort: A→Z</option>
          </select>
          <label className="hint" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={showLocked}
              onChange={(e) => setShowLocked(e.target.checked)}
            />
            Show locked
          </label>
        </div>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="empty">No trophies yet — complete quests to unlock achievements.</div>
      ) : (
        groups.map(([type, items]) => (
          <section key={type} className="sf-card" style={{ borderRadius: 14 }}>
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>{TYPE_LABEL[type] || "General"}</h3>
              <span className="hint">{items.length} {showLocked ? "shown" : "unlocked"}</span>
            </header>
            <div
              className="ach-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {items.map((a) => (
                <AchCard key={a.id} a={a} buff={a.__buff} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
