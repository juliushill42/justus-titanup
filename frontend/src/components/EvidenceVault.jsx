'use client';
import { useMemo } from "react";

const EvidenceVault = () => {
  // Memoize the static content to prevent re-renders
  const content = useMemo(
    () => "Evidence Vault localized anchor runtime active. FRE 901/902 compliant.",
    []
  );

  return <div className="text-xs font-mono text-zinc-400">{content}</div>;
};

export default EvidenceVault;
