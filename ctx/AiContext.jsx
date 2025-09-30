// src/ctx/AiContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AiCtx = createContext(null);

export function AiProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [model, setModel] = useState("openrouter/auto");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/auth/openrouter/me", { credentials: "include" });
      const j = await r.json();
      setConnected(!!j.connected);
    } catch { setConnected(false); }
  }

  useEffect(() => { refresh(); }, []);

  function loginOpenRouter() {
    window.location.href = "/api/auth/openrouter/login";
  }

  async function logoutOpenRouter() {
    await fetch("/api/auth/openrouter/logout", { method: "POST", credentials: "include" });
    setConnected(false);
  }

  async function chat(messages, opts = {}) {
    setBusy(true);
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, model: opts.model || model })
      });
      const j = await r.json();
      if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content;
      if (j?.content) return j.content; // پاسخ ساده‌شده از پروکسی
      return null;
    } finally { setBusy(false); }
  }

  async function chatBYOK({ baseUrl, apiKey, model: m, messages }) {
    const r = await fetch("/api/ai/chat", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "x-base-url": baseUrl,
        "x-model": m
      },
      body: JSON.stringify({ messages, model: m })
    });
    const j = await r.json();
    return j?.choices?.[0]?.message?.content || j?.content || null;
  }

  const api = useMemo(() => ({
    connected, busy, model, setModel,
    loginOpenRouter, logoutOpenRouter, refresh,
    chat, chatBYOK
  }), [connected, busy, model]);

  return <AiCtx.Provider value={api}>{children}</AiCtx.Provider>;
}

export function useAI() {
  return useContext(AiCtx);
}
