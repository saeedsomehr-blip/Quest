// src/ctx/MusicContext.js
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// آیتم صف: { id, type: "yt" | "file", title, src }

const MusicCtx = createContext(null);

export function MusicProvider({ children }) {
  const [queue, setQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qj_music_queue") || "[]"); } catch { return []; }
  });
  const [index, setIndex] = useState(() => {
    try { return Number(localStorage.getItem("qj_music_index") || 0); } catch { return 0; }
  });
  const [volume, setVolume] = useState(() => {
    try { return Number(localStorage.getItem("qj_music_vol") || 0.9); } catch { return 0.9; }
  });
  const [playing, setPlaying] = useState(true);

  const fileURLBag = useRef(new Map()); // id -> ObjectURL برای فایل‌های محلی

  useEffect(() => { localStorage.setItem("qj_music_queue", JSON.stringify(queue)); }, [queue]);
  useEffect(() => { localStorage.setItem("qj_music_index", String(index)); }, [index]);
  useEffect(() => { localStorage.setItem("qj_music_vol", String(volume)); }, [volume]);

  useEffect(() => () => {
    for (const u of fileURLBag.current.values()) URL.revokeObjectURL(u);
    fileURLBag.current.clear();
  }, []);

  const current = queue[index] || null;

  const api = useMemo(() => ({
    queue, index, current, playing, volume,

    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying(p => !p),

    setVolume: (v) => setVolume(Math.max(0, Math.min(1, v))),

    next: () => setIndex(i => (queue.length ? (i + 1) % queue.length : 0)),
    prev: () => setIndex(i => (queue.length ? (i - 1 + queue.length) % queue.length : 0)),
    jump: (i) => setIndex(() => (i >= 0 && i < queue.length ? i : 0)),

    clear: () => setQueue([]),

    addYouTube: (raw, embed) => {
      const id = crypto.randomUUID();
      const title = extractTitleFromURL(raw) || "YouTube Track";
      setQueue(q => [...q, { id, type: "yt", title, src: embed }]);
      return id;
    },

    addFiles: (files) => {
      const items = Array.from(files || []).map(f => {
        const id = crypto.randomUUID();
        const url = URL.createObjectURL(f);
        fileURLBag.current.set(id, url);
        return { id, type: "file", title: f.name, src: url };
      });
      setQueue(q => [...q, ...items]);
    },

    removeAt: (i) => {
      setQueue(q => {
        const item = q[i];
        if (item?.type === "file") {
          const u = fileURLBag.current.get(item.id);
          if (u) { URL.revokeObjectURL(u); fileURLBag.current.delete(item.id); }
        }
        const copy = q.slice();
        copy.splice(i, 1);
        if (i < index) setIndex(idx => Math.max(0, idx - 1));
        if (i === index) setIndex(0);
        return copy;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [queue, index, current, playing, volume]);

  return <MusicCtx.Provider value={api}>{children}</MusicCtx.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicCtx);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}

function extractTitleFromURL(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + u.pathname;
  } catch { return null; }
}
