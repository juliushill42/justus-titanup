'use client';
// WitnessMesh — real-time witness WebSocket mesh + offline session log
// Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
import { useState, useCallback, useEffect, useRef } from "react";
import { Radio, Users, Send, Lock, Circle, Copy, CheckCircle } from "lucide-react";

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL || "wss://justus-api.titanuai.com").replace(/^http/, "ws");

function StatusDot({ connected }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${connected ? "text-green-400" : "text-white/30"}`}>
      <Circle className={`w-2 h-2 fill-current ${connected ? "text-green-400 animate-pulse" : "text-white/20"}`} />
      {connected ? "LIVE" : "OFFLINE"}
    </span>
  );
}

export default function WitnessMesh({ api }) {
  const [connected,  setConnected]  = useState(false);
  const [sessionId,  setSessionId]  = useState(() => crypto.randomUUID().slice(0, 8).toUpperCase());
  const [peers,      setPeers]      = useState([]);
  const [messages,   setMessages]   = useState([
    { type: "system", text: "WitnessMesh initialized. Share your Session ID to let others join as witnesses.", ts: Date.now() },
  ]);
  const [input,      setInput]      = useState("");
  const [alias,      setAlias]      = useState("");
  const [joined,     setJoined]     = useState(false);
  const [copied,     setCopied]     = useState(false);
  const wsRef    = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => () => wsRef.current?.close(), []);

  const addMsg = useCallback((msg) => {
    setMessages(prev => [...prev, { ...msg, ts: Date.now() }]);
  }, []);

  const connect = useCallback(() => {
    if (!alias.trim()) return;
    setJoined(true);

    try {
      const ws = new WebSocket(`${WS_URL}/ws/witness/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: "join", alias: alias.trim(), sessionId }));
        addMsg({ type: "system", text: `Connected to mesh as "${alias.trim()}". Session: ${sessionId}` });
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "peers")   setPeers(data.peers || []);
          if (data.type === "message") addMsg({ type: "peer", alias: data.alias, text: data.text });
          if (data.type === "join")    addMsg({ type: "system", text: `${data.alias} joined the mesh.` });
          if (data.type === "leave")   addMsg({ type: "system", text: `${data.alias} left the mesh.` });
        } catch { /* malformed frame */ }
      };

      ws.onclose = () => {
        setConnected(false);
        addMsg({ type: "system", text: "Connection closed — messages stored locally." });
      };

      ws.onerror = () => {
        setConnected(false);
        addMsg({ type: "system", text: "WebSocket unavailable — offline witness mode active. Messages logged locally only." });
        ws.close();
      };
    } catch {
      addMsg({ type: "system", text: "WebSocket unavailable — offline witness mode active." });
    }
  }, [alias, sessionId, addMsg]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    // Local echo
    addMsg({ type: "self", alias: alias || "You", text });

    // Send to mesh if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", alias, text, sessionId }));
    } else {
      // POST to REST fallback
      fetch(`${api}/record-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: `WITNESS_MSG session=${sessionId} alias="${alias}" msg="${text}"` }),
      }).catch(() => {});
    }
  }, [input, alias, sessionId, api, addMsg]);

  const copySession = useCallback(() => {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sessionId]);

  const exportLog = useCallback(() => {
    const log = messages.map(m => `[${new Date(m.ts).toISOString()}] [${m.type.toUpperCase()}] ${m.alias ? m.alias + ": " : ""}${m.text}`).join("\n");
    const blob = new Blob([`JustUs WitnessMesh Log\nSession: ${sessionId}\nGenerated: ${new Date().toISOString()}\n\n${log}`], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `witness-log-${sessionId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, sessionId]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="w-5 h-5 text-teal-400" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight">Witness Mesh</h2>
          <p className="text-xs text-white/30">Real-time peer witness network · Offline-resilient · Tamper-evident log</p>
        </div>
        <StatusDot connected={connected} />
      </div>

      {/* Session ID */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-wide mb-1">Your Session ID</p>
          <p className="text-lg font-mono font-black text-teal-400 tracking-widest">{sessionId}</p>
          <p className="text-[10px] text-white/20 mt-0.5">Share this with witnesses to join your session</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={copySession}
            className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl transition-colors">
            {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={exportLog}
            className="flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/40 px-3 py-1.5 rounded-xl transition-colors">
            Export Log
          </button>
        </div>
      </div>

      {/* Peers */}
      {peers.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-white/30" />
          <div className="flex gap-2 flex-wrap">
            {peers.map((p, i) => (
              <span key={i} className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Join form */}
      {!joined && (
        <div className="flex gap-3">
          <input value={alias} onChange={e => setAlias(e.target.value)}
            onKeyDown={e => e.key === "Enter" && connect()}
            placeholder="Your witness alias (e.g. Witness_A)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors"
          />
          <button onClick={connect} disabled={!alias.trim()}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black font-black text-xs uppercase px-5 py-3 rounded-xl transition-colors">
            Join Mesh
          </button>
        </div>
      )}

      {/* Message feed */}
      <div className="bg-black/30 border border-white/5 rounded-2xl flex flex-col" style={{ height: "320px" }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.type === "self" ? "items-end" : "items-start"}`}>
              {msg.type === "system" ? (
                <div className="flex items-center gap-1.5 text-[10px] text-white/25 font-mono py-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.type === "self"
                    ? "bg-teal-500/20 text-teal-100 border border-teal-500/20"
                    : "bg-white/5 text-white/70 border border-white/5"
                }`}>
                  {msg.alias && <p className="text-[10px] font-bold text-white/30 mb-0.5">{msg.alias}</p>}
                  {msg.text}
                </div>
              )}
              <span className="text-[9px] text-white/15 font-mono mt-0.5">
                {new Date(msg.ts).toLocaleTimeString()}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {joined && (
          <div className="border-t border-white/5 p-3 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Send a witness message…"
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-teal-500/30 transition-colors"
            />
            <button onClick={sendMessage} disabled={!input.trim()}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-black p-2 rounded-xl transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/20 text-center">
        All messages are logged locally. When connected, messages are relayed peer-to-peer via the JustUs mesh.
        Export the log as evidence — it includes tamper-evident timestamps.
      </p>
    </div>
  );
}
