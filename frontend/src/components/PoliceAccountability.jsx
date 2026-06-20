'use client';
import { useMemo } from "react";

const PoliceAccountability = () => {
  // Memoize the static content to prevent re-renders
  const content = useMemo(
    () => "Oversight Incident Ledger active. Public repository connection online.",
    []
  );

  return <div className="text-xs font-mono text-zinc-400">{content}</div>;
};

export default PoliceAccountability;
