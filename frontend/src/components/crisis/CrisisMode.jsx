'use client';
import { useState, useEffect } from "react";
import { AlertTriangle, Shield, Mic, X, ChevronRight, Gavel, Lock } from "lucide-react";
export default function CrisisMode({ onClose }) {
  const [activeProtocol, setActiveProtocol] = useState(null);
  return (
    <div className="fixed inset-0 z-50 bg-[#050000] text-white flex flex-col font-sans overflow-hidden w-full">
      <header className="p-4 flex justify-between items-center border-b border-red-500/10 bg-black/40 backdrop-blur-md">
        <span className="text-base font-black text-red-500 uppercase">Crisis Mode Active</span>
        <button onClick={onClose} className="text-white/70">X</button>
      </header>
      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold uppercase mb-4">Constitutional Baseline Guard</h3>
        <p className="text-sm text-zinc-400 text-center max-w-md">4th & 5th Amendment protocols locked into local memory matrices.</p>
      </main>
    </div>
  );
}
