import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StartNewTournamentButton from "../../components/StartNewTournamentButton";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button as UIButton } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { getActiveSpaceId } from "@/lib/supabase/spaces";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasDraft = false;
  let activeTournament = null;
  if (user) {
    const spaceId = await getActiveSpaceId();
    if (spaceId) {
      const { data } = await supabase
        .from("wizard_drafts")
        .select("id")
        .eq("space_id", spaceId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      hasDraft = !!data;

      // Fetch latest active tournament for this space
      const { data: t } = await supabase
        .from("tournaments")
        .select("id, name, date, status")
        .eq("space_id", spaceId)
        .eq("status", "active")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (t) activeTournament = t;
    }
  }
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <div className="flex items-center gap-2">
          {hasDraft ? (
            <>
              <UIButton asChild variant="outline">
                <Link href="/tournaments/new">Continue draft</Link>
              </UIButton>
              <StartNewTournamentButton label="Start New Tournament" />
            </>
          ) : (
            <UIButton asChild>
              <Link href="/tournaments/new">Create New Tournament</Link>
            </UIButton>
          )}
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Active Tournament</h2>
          </CardHeader>
          <CardContent>
            {activeTournament ? (
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{activeTournament.name}</div>
                  <div className="text-foreground/60">
                    {activeTournament.date
                      ? new Date(activeTournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UIButton asChild variant="outline" size="sm">
                    <Link href={`/t/${activeTournament.id}/manage`}>Manage</Link>
                  </UIButton>
                  <UIButton asChild variant="outline" size="sm">
                    <Link href={`/t/${activeTournament.id}/live`}>Live</Link>
                  </UIButton>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <p className="text-sm text-foreground/70">No active tournament. Click &quot;Create New Tournament&quot; to start.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick Links</h2>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


