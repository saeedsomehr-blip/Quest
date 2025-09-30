// src/core/xpSuggest.js
// ورودی‌ها: D/I/E/P بین 1..100، hours>=0، level>=1
// مدل: XP = ((Base + TimeBonus) * LevelFactor) سپس رُند به مضرب 5 و در انتها ×5 برای بزرگ‌نمایی عدد.

function clamp01(x) {
  const n = Number(x) || 0;
  return Math.min(1, Math.max(0.01, n)); // حداقل 0.01 چون ورودی‌ها 1..100 هستند
}

/** پیشنهاد XP بر اساس چهار امتیاز ذهنی + زمان */
export function suggestXP({ hours = 1, difficulty = 50, importance = 50, energy = 50, pride = 50, level = 1 }) {
  // 1) نرمال‌سازی 0..1
  const d = clamp01(difficulty / 100);
  const i = clamp01(importance / 100);
  const e = clamp01(energy / 100);
  const p = clamp01(pride / 100);

  // 2) وزن‌های شهودی (اهمیت بیشترین)
  // خروجی S بین ~0.01..1
  const S = 0.35 * i + 0.25 * p + 0.20 * d + 0.20 * e;

  // 3) هسته و زمان (زمان نقش چاشنی، سقف‌دار و ملایم)
  const Base = 200 * S;
  const TimeBonus = 10 * Math.min(Math.sqrt(Math.max(0, hours)), 3); // سقف ~30

  // 4) لِول (ملایم)
  const LevelFactor = 1 + Math.max(1, Number(level) || 1) / 50;

  // 5) رُند به مضرب 5
  const raw = (Base + TimeBonus) * LevelFactor;
  const rounded5 = Math.max(1, Math.round(raw / 5) * 5);

  // 6) بزرگ‌نمایی نمایشی ×5 (طبق خواسته)
  return rounded5 * 5;
}

/** باند مجاز ±۲۰٪ */
export function band20(xp) {
  const d = Math.max(1, Math.round(xp * 0.20));
  return { min: Math.max(1, xp - d), max: xp + d };
}
