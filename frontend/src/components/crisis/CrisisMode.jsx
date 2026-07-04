'use client';
// CrisisMode — SOS overlay with step-by-step constitutional protocols
// Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Shield, Gavel, Mic, Lock, X, ChevronRight, ChevronLeft, Phone } from "lucide-react";

const PROTOCOLS = [
  {
    id:    "stop",
    icon:  Shield,
    color: "text-yellow-400",
    bg:    "bg-yellow-500/10",
    border:"border-yellow-500/20",
    title: "Terry Stop",
    subtitle: "You are being stopped or detained",
    steps: [
      { action: "STAY CALM", detail: "Do not run, do not make sudden movements. Keep hands visible at all times." },
      { action: "ASK CLEARLY", detail: '"Am I being detained, or am I free to go?" — You are legally entitled to a clear answer.' },
      { action: "INVOKE RIGHTS", detail: 'If detained: "I am invoking my right to remain silent and my right to counsel."' },
      { action: "DO NOT CONSENT", detail: '"I do not consent to any searches." — Say this clearly. Refusal cannot be used against you.' },
      { action: "DOCUMENT", detail: "Memorize badge number, name, car number, time, location. Say it aloud if recording." },
    ],
  },
  {
    id:    "arrest",
    icon:  Gavel,
    color: "text-red-400",
    bg:    "bg-red-500/10",
    border:"border-red-500/20",
    title: "Arrest Protocol",
    subtitle: "You are being arrested",
    steps: [
      { action: "DO NOT RESIST", detail: "Physical resistance escalates danger and adds charges. Comply verbally, not physically." },
      { action: "INVOKE SILENCE", detail: '"I am invoking my Fifth Amendment right to remain silent." Say nothing else.' },
      { action: "REQUEST ATTORNEY", detail: '"I want an attorney. I will not answer questions without my attorney present." Repeat if pressed.' },
      { action: "REMEMBER", detail: "You have the right to make a phone call. Contact an attorney or trusted person immediately." },
      { action: "PRESERVE EVIDENCE", detail: "Do not sign anything. Do not consent to DNA, fingerprints, or device searches beyond booking." },
    ],
  },
  {
    id:    "search",
    icon:  Lock,
    color: "text-orange-400",
    bg:    "bg-orange-500/10",
    border:"border-orange-500/20",
    title: "Search Defense",
    subtitle: "Officer requesting or attempting a search",
    steps: [
      { action: "REFUSE CONSENT", detail: '"I do not consent to this search." State this clearly and calmly. You cannot be punished for refusal.' },
      { action: "DO NOT OBSTRUCT", detail: "Step back if ordered. State your non-consent verbally. Do not physically block the officer." },
      { action: "DEMAND WARRANT", detail: '"Do you have a warrant?" If yes, ask to see it. If no, clearly state your non-consent.' },
      { action: "RECORD", detail: "You have the right to film police in public. Hold phone visible and state you are recording." },
      { action: "DOCUMENT EVERYTHING", detail: "Note what was searched, what was taken, badge numbers, time, any witnesses present." },
    ],
  },
  {
    id:    "record",
    icon:  Mic,
    color: "text-teal-400",
    bg:    "bg-teal-500/10",
    border:"border-teal-500/20",
    title: "Recording Rights",
    subtitle: "Documenting the encounter",
    steps: [
      { action: "YOU CAN FILM", detail: "The First Amendment protects your right to record police performing official duties in public spaces." },
      { action: "ANNOUNCE IT", detail: '"I am recording this interaction for documentation purposes." Say this on camera.' },
      { action: "DO NOT INTERFERE", detail: "Maintain distance. Do not physically interfere with the officer's duties while recording." },
      { action: "BACKUP IMMEDIATELY", detail: "Upload to cloud the moment it is safe. Text video to a trusted contact before any device seizure." },
      { action: "IF SEIZED", detail: '"I do not consent to the search or seizure of my device." Demand a receipt for any property taken.' },
    ],
  },
];

const EMERGENCY_CONTACTS = [
  { label: "Emergency",        number: "911",          color: "bg-red-600 hover:bg-red-500" },
  { label: "ACLU Hotline",     number: "212-549-2500", color: "bg-teal-600 hover:bg-teal-500" },
  { label: "NLG Lawyers Guild",number: "212-679-6018", color: "bg-teal-600 hover:bg-teal-500" },
];

export default function CrisisMode({ onClose }) {
  const [activeProtocol, setActiveProtocol] = useState(null);
  const [step,           setStep]           = useState(0);

  // Lock body scroll while crisis overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const openProtocol = useCallback((p) => {
    setActiveProtocol(p);
    setStep(0);
  }, []);

  const closeProtocol = useCallback(() => {
    setActiveProtocol(null);
    setStep(0);
  }, []);

  const currentStep = activeProtocol?.steps[step];
  const totalSteps  = activeProtocol?.steps.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/20 bg-red-950/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight text-red-400">Crisis Mode Active</h1>
            <p className="text-[10px] text-red-400/50">Stay calm · Know your rights · Document everything</p>
          </div>
        </div>
        <button onClick={onClose}
          className="text-white/30 hover:text-white/70 border border-white/10 hover:border-white/20 p-2 rounded-xl transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {!activeProtocol ? (
          <>
            {/* Protocol selection */}
            <div>
              <p className="text-xs text-white/40 uppercase font-bold tracking-wide mb-4">Select Your Situation</p>
              <div className="grid grid-cols-2 gap-3">
                {PROTOCOLS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => openProtocol(p)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${p.bg} ${p.border} hover:brightness-125 transition-all text-left`}>
                      <Icon className={`w-5 h-5 ${p.color}`} />
                      <div>
                        <p className={`text-sm font-black uppercase ${p.color}`}>{p.title}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{p.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 self-end" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emergency contacts */}
            <div>
              <p className="text-xs text-white/40 uppercase font-bold tracking-wide mb-3">Emergency Contacts</p>
              <div className="flex flex-col gap-2">
                {EMERGENCY_CONTACTS.map(c => (
                  <a key={c.label} href={`tel:${c.number}`}
                    className={`flex items-center justify-between ${c.color} text-white px-4 py-3 rounded-xl transition-colors`}>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{c.label}</span>
                    </div>
                    <span className="text-xs font-mono">{c.number}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick rights reminder */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-wide mb-3">Core Rights — Always Apply</p>
              <div className="flex flex-col gap-2 text-xs text-white/50">
                {[
                  "You have the right to remain silent (5th Amendment)",
                  "You have the right to an attorney (6th Amendment)",
                  "You are protected from unreasonable searches (4th Amendment)",
                  "You can film police in public (1st Amendment)",
                  "You can sue for civil rights violations (42 U.S.C. § 1983)",
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Shield className="w-3 h-3 text-teal-400/60 flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Step-through protocol */
          <div className="flex flex-col gap-4 flex-1">
            {/* Protocol header */}
            <div className="flex items-center gap-3">
              <button onClick={closeProtocol} className="text-white/30 hover:text-white/70 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {(() => { const Icon = activeProtocol.icon; return <Icon className={`w-5 h-5 ${activeProtocol.color}`} />; })()}
              <div>
                <h2 className={`text-sm font-black uppercase ${activeProtocol.color}`}>{activeProtocol.title}</h2>
                <p className="text-[10px] text-white/30">{activeProtocol.subtitle}</p>
              </div>
            </div>

            {/* Step progress */}
            <div className="flex gap-1.5">
              {activeProtocol.steps.map((_, i) => (
                <div key={i} onClick={() => setStep(i)} className={`flex-1 h-1 rounded-full cursor-pointer transition-colors ${
                  i <= step ? activeProtocol.color.replace("text-", "bg-") : "bg-white/10"
                }`} />
              ))}
            </div>

            {/* Current step */}
            <div className={`flex-1 border ${activeProtocol.border} ${activeProtocol.bg} rounded-2xl p-6 flex flex-col justify-center gap-4`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">STEP {step + 1} / {totalSteps}</span>
              </div>
              <h3 className={`text-2xl font-black uppercase tracking-tight ${activeProtocol.color}`}>
                {currentStep?.action}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">{currentStep?.detail}</p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex-1 flex items-center justify-center gap-2 border border-white/10 text-white/40 hover:text-white/70 disabled:opacity-20 py-3 rounded-xl text-xs font-bold uppercase transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              {step < totalSteps - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className={`flex-1 flex items-center justify-center gap-2 ${activeProtocol.bg} border ${activeProtocol.border} ${activeProtocol.color} hover:brightness-125 py-3 rounded-xl text-xs font-bold uppercase transition-all`}>
                  Next Step
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={closeProtocol}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:brightness-125 py-3 rounded-xl text-xs font-bold uppercase transition-all">
                  Done
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
