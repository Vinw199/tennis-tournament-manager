"use client";

import { useRouter } from "next/navigation";
import { clearWizardDraftInDbClient } from "../data/wizardDraft.client";

export default function StartNewTournamentButton({ label = "Start New Tournament" }) {
  const router = useRouter();

  async function onClick() {
    const ok = window.confirm("Starting a new tournament will delete your existing draft. Continue?");
    if (!ok) return;
    try {
      await clearWizardDraftInDbClient();
    } catch (e) {
      // no-op; still navigate to wizard
    }
    router.push("/tournaments/new");
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm text-white shadow hover:opacity-95"
      title="Start a new tournament and discard the existing draft"
    >
      {label}
    </button>
  );
}


