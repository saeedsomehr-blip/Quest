// src/components/GlobalPlayer.jsx
import React, { useEffect, useRef } from "react";
import { useMusic } from "../ctx/MusicContext";

function normalizeYouTube(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch" && u.searchParams.get("v")) {
        return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1`;
      }
      if (u.pathname === "/playlist" && u.searchParams.get("list")) {
        return `https://www.youtube.com/embed/videoseries?list=${u.searchParams.get("list")}&autoplay=1`;
      }
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
  } catch {}
  return null;
}

export function addYouTubeToQueue(rawUrl, ctx) {
  const embed = normalizeYouTube(rawUrl);
  if (!embed) return false;
  ctx.addYouTube(rawUrl, embed);
  return true;
}

export default function GlobalPlayer() {
  const m = useMusic();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = m.volume;
  }, [m.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (m.current?.type === "file") {
      if (m.playing) audio.play().catch(()=>{});
      else audio.pause();
    }
  }, [m.current, m.playing]);

  if (!m.current) {
    return (
      <div className="global-player">
        <div className="gp-title">No track</div>
        <div className="gp-controls">
          <button className="btn" disabled>⏮</button>
          <button className="btn" disabled>▶</button>
          <button className="btn" disabled>⏭</button>
        </div>
      </div>
    );
  }

  const isFile = m.current.type === "file";

  return (
    <div className="global-player">
      <div className="gp-title" title={m.current.title}>{m.current.title}</div>

      <div className="gp-controls">
        <button className="btn" onClick={m.prev}>⏮</button>
        <button className="btn" onClick={m.toggle}>{m.playing ? "⏸" : "▶"}</button>
        <button className="btn" onClick={m.next}>⏭</button>
      </div>

      <div className="gp-vol">
        <input
          type="range" min="0" max="1" step="0.01"
          value={m.volume}
          onChange={e => m.setVolume(parseFloat(e.target.value))}
        />
      </div>

      <div className="gp-view">
        {isFile ? (
          <audio
            ref={audioRef}
            src={m.current.src}
            autoPlay
            controls
            onEnded={m.next}
          />
        ) : (
          <iframe
            title="yt"
            src={m.current.src}
            allow="autoplay; encrypted-media"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
    </div>
  );
}
