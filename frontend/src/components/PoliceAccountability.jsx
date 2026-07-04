'use client';
// PoliceAccountability — incident logger + risk prediction + officer record lookup
// Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
import { useState, useCallback } from "react";
import { Eye, Send, AlertTriangle, CheckCircle, FileWarning, MapPin, Clock, User, Hash } from "lucide-react";

const VIOLATION_TYPES = [
  "Excessive Force",
  "Unlawful Search / Seizure",
  "False Arrest",
  "Racial Profiling",
  "Failure to Identify",
  "Denial of Medical Care",
  "Retaliation",
  "Miranda Violation",
  "Other",
];

const RISK_COLORS = {
  LOW:    { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20"  },
  MEDIUM: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  HIGH:   { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20"    },
};

const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors w-full";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase text-white/40 tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function RiskBadge({ level }) {
  const c = RISK_COLORS[level] || RISK_COLORS.LOW;
  return (
    <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 rounded ${c.bg} ${c.text} ${c.border}`}>
      {level} RISK
    </span>
  );
}

// Sovereign offline risk assessment
function assessRisk(form) {
  let score = 0;
  const flags = [];

  if (form.violations.includes("Excessive Force"))      { score += 3; flags.push("Excessive force reported — document injuries immediately"); }
  if (form.violations.includes("False Arrest"))         { score += 2; flags.push("False arrest — invoke right to remain silent, request attorney"); }
  if (form.violations.includes("Racial Profiling"))     { score += 2; flags.push("Racial profiling — document officer demographics and stated reason"); }
  if (form.violations.includes("Denial of Medical Care")){ score += 3; flags.push("Medical denial — life-threatening, seek care immediately"); }
  if (form.weaponDrawn)                                 { score += 2; flags.push("Weapon was drawn — prioritize safety, comply verbally"); }
  if (form.witnesses)                                   { score -= 1; flags.push("Witnesses present — collect contact info immediately"); }
  if (form.bodycam === "no")                            { score += 1; flags.push("No body camera — your documentation is the primary record"); }
  if (form.officerBadge)                                { flags.push(`Badge #${form.officerBadge} logged — file FOIA request for officer history`); }

  const level = score >= 5 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";

  const actions = [
    "Document everything NOW: badge numbers, time, location, witnesses.",
    "Do not discuss the incident on social media until you consult an attorney.",
    score >= 3 ? "File a civilian complaint with the police department's Internal Affairs division." : null,
    score >= 4 ? "Preserve all evidence — photos, medical records, surveillance footage requests." : null,
    score >= 5 ? "Contact an attorney immediately — §1983 civil rights claim may be viable." : null,
    "Request all body camera and dashcam footage within 72 hours via FOIA before retention windows expire.",
  ].filter(Boolean);

  return { level, score, flags, actions };
}

export default function PoliceAccountability({ api }) {
  const [form, setForm] = useState({
    date:        "",
    time:        "",
    location:    "",
    officerName: "",
    officerBadge:"",
    department:  "",
    violations:  [],
    narrative:   "",
    weaponDrawn: false,
    witnesses:   false,
    bodycam:     "unknown",
    injured:     false,
  });

  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [submitted,setSubmitted]= useState(false);

  const set = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  const toggleViolation = useCallback((v) => {
    setForm(p => ({
      ...p,
      violations: p.violations.includes(v)
        ? p.violations.filter(x => x !== v)
        : [...p.violations, v],
    }));
  }, []);

  const submit = useCallback(async () => {
    if (!form.narrative.trim() || !form.location.trim()) return;
    setLoading(true);
    setResult(null);

    // Offline risk assessment — always runs
    const assessment = assessRisk(form);

    try {
      // Try backend
      const res = await fetch(`${api}/risk-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ ...assessment, ...data, level: data.risk_level || assessment.level });
      } else {
        setResult(assessment);
      }

      // Log to timeline
      await fetch(`${api}/record-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: `INCIDENT_LOGGED location="${form.location}" officer="${form.officerBadge || "unknown"}" risk=${assessment.level}`,
        }),
      }).catch(() => {});
    } catch {
      setResult(assessment);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }, [form, api]);

  const reset = useCallback(() => {
    setForm({ date:"", time:"", location:"", officerName:"", officerBadge:"",
      department:"", violations:[], narrative:"", weaponDrawn:false,
      witnesses:false, bodycam:"unknown", injured:false });
    setResult(null);
    setSubmitted(false);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Eye className="w-5 h-5 text-teal-400" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight">Police Accountability</h2>
          <p className="text-xs text-white/30">Incident documentation · AI risk assessment · §1983 guidance</p>
        </div>
      </div>

      {!submitted ? (
        <>
          {/* Incident details */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Incident">
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Time of Incident">
              <input type="time" value={form.time} onChange={e => set("time", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Location">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-3.5 h-3.5 text-white/20" />
              <input value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="Street address, intersection, or landmark"
                className={inputCls + " pl-9"} />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Officer Name (if known)">
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-3.5 h-3.5 text-white/20" />
                <input value={form.officerName} onChange={e => set("officerName", e.target.value)}
                  placeholder="Last, First" className={inputCls + " pl-9"} />
              </div>
            </Field>
            <Field label="Badge Number">
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 w-3.5 h-3.5 text-white/20" />
                <input value={form.officerBadge} onChange={e => set("officerBadge", e.target.value)}
                  placeholder="e.g. 4821" className={inputCls + " pl-9"} />
              </div>
            </Field>
          </div>

          <Field label="Department / Agency">
            <input value={form.department} onChange={e => set("department", e.target.value)}
              placeholder="e.g. Atlanta PD, Fulton County Sheriff" className={inputCls} />
          </Field>

          {/* Violation types */}
          <Field label="Violations (select all that apply)">
            <div className="flex flex-wrap gap-2">
              {VIOLATION_TYPES.map(v => (
                <button key={v} onClick={() => toggleViolation(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    form.violations.includes(v)
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/5 text-white/30 hover:text-white/60 border border-white/5"
                  }`}>{v}</button>
              ))}
            </div>
          </Field>

          {/* Circumstances */}
          <Field label="Circumstances">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "weaponDrawn", label: "Weapon was drawn" },
                { key: "witnesses",   label: "Witnesses present" },
                { key: "injured",     label: "I was injured" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <div onClick={() => set(key, !form[key])}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      form[key] ? "bg-teal-500 border-teal-500" : "border-white/20 group-hover:border-white/40"
                    }`}>
                    {form[key] && <CheckCircle className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-xs text-white/50">{label}</span>
                </label>
              ))}
              <Field label="Body Camera">
                <select value={form.bodycam} onChange={e => set("bodycam", e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500/40">
                  <option value="unknown">Unknown</option>
                  <option value="yes">Yes — visible</option>
                  <option value="no">No / Off</option>
                  <option value="covered">Covered / Obstructed</option>
                </select>
              </Field>
            </div>
          </Field>

          {/* Narrative */}
          <Field label="Detailed Narrative">
            <textarea value={form.narrative} onChange={e => set("narrative", e.target.value)} rows={6}
              placeholder="Describe the incident in chronological order: what happened before, during, and after the encounter. Include exact words spoken where possible."
              className={inputCls + " resize-y"} />
          </Field>

          <button onClick={submit} disabled={loading || !form.narrative.trim() || !form.location.trim()}
            className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-black font-black text-xs uppercase py-3 rounded-xl transition-colors">
            <Send className="w-3.5 h-3.5" />
            {loading ? "Analyzing…" : "Submit & Assess Risk"}
          </button>
        </>
      ) : (
        /* Results */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">Incident Logged</span>
            </div>
            {result && <RiskBadge level={result.level} />}
          </div>

          {/* Summary card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-2 text-xs text-white/40">
            {form.date && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{form.date}{form.time && ` at ${form.time}`}</span>}
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{form.location}</span>
            {form.officerBadge && <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" />Badge #{form.officerBadge}{form.officerName && ` — ${form.officerName}`}</span>}
            {form.violations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {form.violations.map(v => (
                  <span key={v} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono">{v}</span>
                ))}
              </div>
            )}
          </div>

          {result && (
            <>
              {/* Flags */}
              {result.flags?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase text-white/30 tracking-wide">Assessment Flags</p>
                  {result.flags.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5">
                      <FileWarning className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-white/60">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended actions */}
              {result.actions?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase text-white/30 tracking-wide">Recommended Actions</p>
                  {result.actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 bg-teal-500/5 border border-teal-500/10 rounded-xl px-4 py-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-white/70">{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <button onClick={reset}
            className="text-white/30 hover:text-white/60 text-xs font-bold uppercase py-2 border border-white/5 hover:border-white/10 rounded-xl transition-colors">
            Log Another Incident
          </button>
        </div>
      )}
    </div>
  );
}
