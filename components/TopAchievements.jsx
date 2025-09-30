// src/components/TopAchievements.jsx
import React, { useMemo } from "react";

/**
 * ورودی: ach = {
 *   unlocked: [
 *     { id, label, tier, icon, gainedAt, type, family?, baseId? }
 *   ]
 * }
 *
 * هدف: نمایش ۵ تا از بالاترین تروفی‌های «به‌روز» کاربر.
 * - اگر از یک تروفی چند «Tier» مختلف گرفته شده، فقط بالاترین Tier همان خانواده نشان داده می‌شود.
 * - مرتب‌سازی: اول tier بالاتر، بعد جدیدتر (gainedAt).
 * - props:
 *    - limit? = 5  (می‌تونی تعداد را تغییر بدی)
 */
export default function TopAchievements({ ach, limit = 5 }) {
  const top = useMemo(() => {
    if (!ach || !Array.isArray(ach.unlocked)) return [];

    // 1) دی‌داپلیکیت بر اساس خانواده‌ی اچیومنت
    //    familyKey: اولویت با a.family یا a.baseId؛ در غیر این صورت بر اساس label
    const bestPerFamily = new Map();
    for (const a of ach.unlocked) {
      const familyKey = (a.family || a.baseId || a.label || a.id || "").toLowerCase();
      const prev = bestPerFamily.get(familyKey);

      if (!prev) {
        bestPerFamily.set(familyKey, a);
        continue;
      }

      const prevTier = prev.tier || 0;
      const curTier = a.tier || 0;

      // اگر Tier جدید بالاتره، جایگزین کن
      if (curTier > prevTier) {
        bestPerFamily.set(familyKey, a);
      } else if (curTier === prevTier) {
        // اگر Tier مساوی بود، جدیدتر را نگه دار
        const prevTime = new Date(prev.gainedAt || 0).getTime();
        const curTime  = new Date(a.gainedAt  || 0).getTime();
        if (curTime > prevTime) bestPerFamily.set(familyKey, a);
      }
    }

    // 2) مرتب‌سازی خانواده‌های یکتا
    const unique = [...bestPerFamily.values()];
    unique.sort((a, b) => {
      const ta = a.tier || 0, tb = b.tier || 0;
      if (tb !== ta) return tb - ta;
      const da = new Date(a.gainedAt || 0).getTime();
      const db = new Date(b.gainedAt || 0).getTime();
      return db - da;
    });

    // 3) تنها n مورد اول
    return unique.slice(0, limit);
  }, [ach, limit]);

  if (top.length === 0) return null;

  return (
    <div
      className="top-achievements"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
      }}
    >
      {top.map((a) => (
        <div
          key={a.id}
          className="ach-pill"
          title={`${a.label}${a.tier ? ` (Tier ${a.tier})` : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 12,
            background:
              "linear-gradient(180deg, var(--card), rgba(0,0,0,0.02))",
            border: "1px solid var(--border)",
            fontSize: 13,
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>
            {a.icon || "🏆"}
          </span>
          <span style={{ fontWeight: 600 }}>{a.label}</span>
          {a.tier ? (
            <span
              className="hint"
              style={{
                fontSize: 12,
                paddingLeft: 4,
                borderLeft: "1px solid var(--border)",
                marginLeft: 4,
              }}
            >
              Tier {a.tier}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
