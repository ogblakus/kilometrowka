"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export default function Toast({ message, onClose, durationMs = 2800 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg"
    >
      {message}
    </div>
  );
}
