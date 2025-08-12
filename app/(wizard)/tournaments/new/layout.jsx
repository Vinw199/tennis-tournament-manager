export default function WizardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-foreground/70">Tournament Setup</div>
          <a className="text-sm text-brand underline" href="/">Exit setup</a>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl p-6 md:p-8">{children}</main>
    </div>
  );
}



