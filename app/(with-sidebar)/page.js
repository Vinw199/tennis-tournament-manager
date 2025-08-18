import Link from "next/link";
import { getWizardDraft } from "../../lib/wizardDraft";

export default function Dashboard() {
  const hasDraft = !!getWizardDraft?.();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <Link
              href="/tournaments/new"
              className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-4 py-2 text-sm shadow hover:bg-black/5"
            >
              Continue setup
            </Link>
          )}
          <Link
            href="/tournaments/new"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-white shadow hover:opacity-95"
          >
            Create New Tournament
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 text-lg font-semibold">Active Tournament</h2>
          <p className="text-sm text-foreground/70">
            No active tournament. Click &quot;Create New Tournament&quot; to start.
          </p>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5">
          <h2 className="mb-2 text-lg font-semibold">Quick Links</h2>
          <ul className="text-sm leading-7">
            <li>
              <Link className="text-brand underline" href="/roster">
                Manage Club Roster
              </Link>
            </li>
            <li>
              <Link className="text-brand underline" href="/past-events">
                View Past Events
              </Link>
            </li>
            <li>
              <Link className="text-brand underline" href="/settings">
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}


