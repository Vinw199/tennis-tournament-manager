"use client";

import { useRouter } from "next/navigation";
import Button from "../../../../components/ui/Button";
import { upsertWizardDraftInDbClient } from "../../../../data/wizardDraft.client";

export default function WizardLayout({ children }) {
  const router = useRouter();
  // No need to show "Continue setup" while already in the wizard
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-foreground/70">Tournament Setup</div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                const ok = confirm("Save draft before exit? Press Cancel to stay on this page.");
                if (ok) {
                  upsertWizardDraftInDbClient({ step: 1, savedAt: Date.now() });
                  router.push("/");
                }
              }}
            >
              Exit setup
            </Button>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl p-6 md:p-8">{children}</main>
    </div>
  );
}



