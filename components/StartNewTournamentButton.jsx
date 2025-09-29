"use client";

import { useRouter } from "next/navigation";
import { clearWizardDraftInDbClient } from "../lib/wizard/draft.js";
import { PlusCircle } from "lucide-react";
import { Button } from "./ui/Button.jsx";

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
    <Button onClick={onClick} title="Start a new tournament and discard the existing draft">
      <PlusCircle className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </Button>
  );
}


