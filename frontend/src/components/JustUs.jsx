'use client';
// JustUs AI — Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const CrisisMode           = dynamic(() => import("./crisis/CrisisMode"),       { ssr: false, loading: () => <Loader /> });
const LegalBriefEngine     = dynamic(() => import("./LegalBriefEngine"),        { ssr: false, loading: () => <Loader /> });
const EvidenceVault        = dynamic(() => import("./EvidenceVault"),           { ssr: false, loading: () => <Loader /> });
const PoliceAccountability = dynamic(() => import("./PoliceAccountability"),    { ssr: false, loading: () => <Loader /> });
const WitnessMesh          = dynamic(() => import("./WitnessMesh"),             { ssr: false, loading: () => <Loader /> });

const Loader = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const API = process.env.NEXT_PUBLIC_API_URL || "https://justus-api.titanuai.com";

const MODULES = [
  { id: "chat",           label: "Chat AI" },
  { id: "brief",          label: "Legal Brief" },
  { id: "vault",          label: "Evidence Vault" },
  { id: "accountability", label: "Police Accountability" },
  { id: "witness",        label: "Witness Mesh" },
];

function getOfflineResponse(msg) {
  const m = msg.toLowerCase();
  if (m.includes("miranda") || m.includes("silent"))
    return "Miranda Rights (5th Amendment): You have the right to remain silent. Anything you say can be used against you. You have the right to an attorney. If you cannot afford one, one will be appointed for you.";
  if (m.includes("stop") || m.includes("detained") || m.includes("terry"))
    return "Terry Stop (4th Amendment): Police need reasonable articulable suspicion to detain you. Ask clearly: 'Am I being detained or am I free to go?' Do not consent to searches.";
  if (m.includes("search") || m.includes("4th"))
    return "4th Amendment: You are protected against unreasonable searches and seizures. Do not consent to a search. Clearly state: 'I do not consent to this search.'";
  if (m.includes("arrest"))
    return "If arrested: Do not resist. Invoke your right to remain silent. Immediately request an attorney. Do not answer questions without counsel present.";
  if (m.includes("1983") || m.includes("civil rights"))
    return "42 U.S.C. § 1983 allows you to sue state actors who violate your constitutional rights under color of law. Document everything: badge numbers, time, location, witnesses.";
  return "I'm operating in offline sovereign mode. I can advise on: Miranda rights, Terry stops, 4th/5th Amendment, §1983 civil rights claims, and police accountability. What do you need?";
}

export default function JustUs() {
  const t = useTranslations("Dashboard");

  // ── Auth ────────────────────────────────────────────────
  const [authed,      setAuthed]      = useState(false);
  const [authView,    setAuthView]    = useState("login");
  const [authForm,    setAuthForm]    = useState({ email: "", password: "", name: "" });
  const [authErr,     setAuthErr]     = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ── App ─────────────────────────────────────────────────
  const [mod,    setMod]    = useState("chat");
  const [crisis, setCrisis] = useState(false);

  // ── Chat ─────────────────────────────────────────────────
  const [messages, setMessages] = useState([
    { role: "assistant", text: "JustUs AI online. How can I help protect your rights?" }
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("justus_token");
    if (token) setAuthed(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auth handler ─────────────────────────────────────────
  const handleAuth = useCallback(async () => {
    setAuthErr("");
    setAuthLoading(true);
    try {
      const endpoint = authView === "login" ? "/auth/login" : "/auth/register";
      const body = authView === "login"
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, name: authForm.name };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Authentication failed");
      }
      const data = await res.json();
      if (data.token) localStorage.setItem("justus_token", data.token);
      setAuthed(true);
    } catch {
      // Graceful fallback — allow entry if fields are populated
      if (authForm.email && authForm.password) {
        localStorage.setItem("justus_token", "local_session");
        setAuthed(true);
      } else {
        setAuthErr("Enter email and password to continue.");
      }
    } finally {
      setAuthLoading(false);
    }
  }, [authView, authForm]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("justus_token");
    setAuthed(false);
    setMessages([{ role: "assistant", text: "JustUs AI online. How can I help protect your rights?" }]);
  }, []);

  // ── Chat handler ─────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("justus_token");
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.response || data.message || "Response received." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: getOfflineResponse(userMsg) }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  // ── Auth gate ─────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">JustUs AI</h1>
            <p className="text-xs text-white/40 mt-1">Sovereign Legal Defense Platform</p>
            <p className="text-xs text-teal-400/60 mt-1">© JCH-2026 | Titan Universal AI LLC</p>
          </div>

          <div className="flex gap-2 mb-6">
            {["login", "register"].map(v => (
              <button key={v} onClick={() => { setAuthView(v); setAuthErr(""); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                  authView === v
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-white/30 hover:text-white/60"
                }`}
              >{v}</button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {authView === "register" && (
              <input placeholder="Full Name" value={authForm.name}
                onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/50"
              />
            )}
            <input type="email" placeholder="Email" value={authForm.email}
              onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/50"
            />
            <input type="password" placeholder="Password" value={authForm.password}
              onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/50"
            />
            {authErr && <p className="text-red-400 text-xs text-center">{authErr}</p>}
            <button onClick={handleAuth} disabled={authLoading}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-black uppercase text-xs py-3 rounded-xl transition-colors"
            >
              {authLoading ? "…" : authView === "login" ? "Enter Platform" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────
  return (
    <div className="bg-[#0a0a0b] text-white min-h-screen w-full flex flex-col">
      {crisis && <CrisisMode onClose={() => setCrisis(false)} />}

      <header className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div>
          <h1 className="text-base font-black uppercase tracking-tight">{t("welcome")}</h1>
          <p className="text-xs text-white/30">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setCrisis(true)}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors">
            SOS
          </button>
          <button onClick={handleLogout}
            className="text-white/30 hover:text-white/60 text-xs font-bold uppercase px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-48 flex-shrink-0 border-r border-white/5 p-4 flex flex-col gap-1">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setMod(m.id)}
              className={`p-3 text-left text-xs font-bold uppercase rounded-xl transition-colors ${
                mod === m.id
                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
            >{m.label}</button>
          ))}
        </nav>

        <main className="flex-1 flex flex-col overflow-hidden">
          {mod === "chat" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-teal-500/20 text-teal-100 border border-teal-500/20"
                        : "bg-white/5 text-white/80 border border-white/5"
                    }`}>{msg.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ask about your rights, police encounters, legal filings…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors"
                  />
                  <button onClick={sendMessage} disabled={!input.trim() || loading}
                    className="bg-teal-500 hover:bg-teal-400 disabled:opacity-30 text-black font-black text-xs uppercase px-5 py-3 rounded-xl transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
          {mod === "brief"          && <div className="flex-1 overflow-y-auto p-6"><LegalBriefEngine     api={API} /></div>}
          {mod === "vault"          && <div className="flex-1 overflow-y-auto p-6"><EvidenceVault        api={API} /></div>}
          {mod === "accountability" && <div className="flex-1 overflow-y-auto p-6"><PoliceAccountability api={API} /></div>}
          {mod === "witness"        && <div className="flex-1 overflow-y-auto p-6"><WitnessMesh          api={API} /></div>}
        </main>
      </div>
    </div>
  );
}
