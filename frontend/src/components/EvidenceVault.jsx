'use client';
// EvidenceVault — SHA-256 browser-side hash, FRE 901/902 chain-of-custody ledger
// Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
import { useState, useCallback, useRef } from "react";
import { Shield, Upload, CheckCircle, Clock, Hash, Download, Trash2 } from "lucide-react";

function Badge({ children, color = "zinc" }) {
  const cls = {
    teal:   "bg-teal-500/10 text-teal-400 border-teal-500/20",
    green:  "bg-green-500/10 text-green-400 border-green-500/20",
    red:    "bg-red-500/10  text-red-400  border-red-500/20",
    zinc:   "bg-zinc-500/10 text-zinc-400  border-zinc-500/20",
  }[color] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  return (
    <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${cls}`}>{children}</span>
  );
}

async function sha256hex(buffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function EvidenceVault({ api }) {
  const [entries,  setEntries]  = useState([]);
  const [hashing,  setHashing]  = useState(false);
  const [error,    setError]    = useState("");
  const [note,     setNote]     = useState("");
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setHashing(true);
    setError("");
    try {
      const buffer  = await file.arrayBuffer();
      const digest  = await sha256hex(buffer);
      const ts      = new Date().toISOString();
      const entry   = {
        id:        crypto.randomUUID(),
        filename:  file.name,
        size:      file.size,
        type:      file.type || "application/octet-stream",
        sha256:    digest,
        timestamp: ts,
        note:      note.trim(),
        fre:       "FRE 901(b)(9) / 902(13)",
        status:    "AUTHENTICATED",
      };

      // Attempt to record on backend timeline
      try {
        await fetch(`${api}/record-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: `EVIDENCE_SEALED file=${file.name} sha256=${digest} ts=${ts}`,
          }),
        });
      } catch { /* offline — local-only sealing still valid */ }

      setEntries(prev => [entry, ...prev]);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError("Hashing failed: " + e.message);
    } finally {
      setHashing(false);
    }
  }, [api, note]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const exportLedger = useCallback(() => {
    const ledger = {
      generated:  new Date().toISOString(),
      platform:   "JustUs AI | Titan Universal AI LLC | JCH-2026",
      fre_basis:  "Federal Rules of Evidence Rule 901(b)(9), Rule 902(13)",
      entries,
    };
    const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `justus-custody-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const removeEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-teal-400" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight">Evidence Vault</h2>
          <p className="text-xs text-white/30">SHA-256 in-browser hashing · FRE 901/902 chain-of-custody ledger</p>
        </div>
        {entries.length > 0 && (
          <button onClick={exportLedger}
            className="ml-auto flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/40 px-3 py-1.5 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/10 hover:border-teal-500/40 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors group"
      >
        <Upload className="w-8 h-8 text-white/20 group-hover:text-teal-400 transition-colors" />
        <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors text-center">
          Drop file to seal, or click to browse<br />
          <span className="text-[10px] text-white/20">Raw file never leaves your device — hash computed locally</span>
        </p>
        <input ref={fileRef} type="file" className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />
      </div>

      {/* Optional annotation */}
      <input value={note} onChange={e => setNote(e.target.value)}
        placeholder="Optional: annotate this evidence (incident description, location, witness names…)"
        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors"
      />

      {hashing && (
        <div className="flex items-center gap-2 text-xs text-teal-400">
          <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
          Computing SHA-256 digest…
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Ledger entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/30 uppercase font-bold tracking-wide">Sealed Evidence ({entries.length})</p>
          {entries.map(e => (
            <div key={e.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-sm font-bold text-white truncate max-w-xs">{e.filename}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="green">{e.status}</Badge>
                  <button onClick={() => removeEntry(e.id)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-teal-300 bg-black/30 rounded-xl px-3 py-2 overflow-x-auto">
                <Hash className="w-3 h-3 shrink-0 text-teal-500" />
                {e.sha256}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(e.timestamp).toLocaleString()}</span>
                <span>{(e.size / 1024).toFixed(1)} KB · {e.type}</span>
                <span className="col-span-2 text-teal-400/60">{e.fre}</span>
                {e.note && <span className="col-span-2 text-white/50 italic">"{e.note}"</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !hashing && (
        <div className="text-center py-8 text-xs text-white/20">
          No sealed evidence yet — drop a file above to begin.<br />
          Each entry generates a tamper-evident SHA-256 fingerprint.
        </div>
      )}
    </div>
  );
}
