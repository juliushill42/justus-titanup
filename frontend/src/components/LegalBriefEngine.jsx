'use client';
import { useMemo } from "react";

const LegalBriefEngine = () => {
  // Memoize the static content to prevent re-renders
  const content = useMemo(
    () => "Legal Brief Engine active. Baseline structural mandates ready.",
    []
  );

  return <div className="text-xs font-mono text-zinc-400">{content}</div>;
};

export default LegalBriefEngine;
