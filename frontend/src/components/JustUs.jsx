'use client';
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "next-intl";

// Code-split heavy components
const CrisisMode = dynamic(() => import("./crisis/CrisisMode"), { 
  loading: () => <div className="text-white/50">Loading...</div>,
  ssr: false 
});
const LegalBriefEngine = dynamic(() => import("./LegalBriefEngine"), { 
  ssr: false 
});
const EvidenceVault = dynamic(() => import("./EvidenceVault"), { 
  ssr: false 
});
const PoliceAccountability = dynamic(() => import("./PoliceAccountability"), { 
  ssr: false 
});

export default function JustUs() {
  const t = useTranslation("Dashboard");
  const [mod, setMod] = useState("chat");
  const [crisis, setCrisis] = useState(false);

  // Memoize module list to prevent unnecessary re-renders
  const modules = useMemo(() => ["chat", "brief", "vault", "accountability"], []);

  // Memoize component rendering logic
  const renderContent = useMemo(() => {
    return () => {
      switch (mod) {
        case "brief":
          return <LegalBriefEngine />;
        case "vault":
          return <EvidenceVault />;
        case "accountability":
          return <PoliceAccountability />;
        default:
          return <div className="text-sm text-white/70">{t("subtitle")}</div>;
      }
    };
  }, [mod, t]);

  return (
    <div className="bg-[#0a0a0b] text-white min-h-screen w-full flex flex-col p-6">
      {crisis && <CrisisMode onClose={() => setCrisis(false)} />}
      
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
        <h1 className="text-lg font-black uppercase tracking-tight">{t("welcome")}</h1>
        <button 
          onClick={() => setCrisis(true)} 
          className="bg-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
          aria-label="Emergency SOS mode"
        >
          SOS
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <nav className="flex flex-col gap-2">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setMod(m)}
              className={`p-3 text-left text-xs uppercase font-bold rounded-xl transition-colors ${
                mod === m ? "bg-teal-500/10 text-teal-400" : "text-white/40 hover:text-white/60"
              }`}
              aria-current={mod === m ? "page" : undefined}
            >
              {m}
            </button>
          ))}
        </nav>

        <main className="lg:col-span-3 bg-white/[0.01] border border-white/5 rounded-2xl p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
