// path: app/(wizard)/tournaments/new/layout.jsx

"use client";

export default function WizardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-foreground/70">Tournament Setup</div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm text-white shadow hover:opacity-95 cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('wizard:exit'))
              }}
            >
              Exit Draft
            </button>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl p-6 md:p-8">{children}</main>
    </div>
  );
}



