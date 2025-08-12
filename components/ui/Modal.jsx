"use client";

import { useEffect } from "react";

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-black/10 bg-white shadow-xl">
        <div className="border-b bg-black/5 px-5 py-3 text-sm font-semibold">{title}</div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}



