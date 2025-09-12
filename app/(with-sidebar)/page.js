// This is the dashboard page
// This is a protected route, protected from users who don't have a space
// If user doesn't have a space, they are redirected to the onboarding page

import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StartNewTournamentButton from "../../components/StartNewTournamentButton";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button as UIButton } from "../../components/ui/button";
import { FileText, Trophy, Users, History, Settings, ChevronRight } from "lucide-react";
import { getActiveSpaceId, listSpaces } from "@/lib/supabase/spaces";
import { redirect } from "next/navigation";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { Badge } from "@/components/ui/badge";

function DashboardContent({ activeTournament, hasDraft }) {
  // STATE 1: ACTIVE TOURNAMENT
  if (activeTournament) {
    return (
      <Card className="border-primary/20 bg-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Tournament</h2>
            <Badge variant="outline" className="border-green-600 text-green-600">● Live</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-full flex-col items-center justify-center space-y-3 p-8 text-center">
            <h3 className="text-xl font-bold">{activeTournament.name}</h3>
            <p className="text-sm text-muted-foreground">
              {activeTournament.date ? new Date(activeTournament.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Date not set"}
            </p>
            <div className="flex items-center gap-2 pt-4">
              <UIButton asChild variant="outline">
                <Link href={`/t/${activeTournament.id}/manage`}>Manage</Link>
              </UIButton>
              <UIButton asChild>
                <Link href={`/t/${activeTournament.id}/live`}>Live View</Link>
              </UIButton>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // STATE 2: DRAFT IN PROGRESS
  else if (hasDraft) {
    return (
      <Card>
        <CardHeader><h2 className="text-lg font-medium text-muted-foreground">Draft in Progress</h2></CardHeader>
        <CardContent>
          <div className="flex h-full flex-col items-center justify-center space-y-3 p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">You have an unfinished tournament draft.</h3>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">Continue where you left off to get the event started.</p>
            <UIButton asChild className="mt-4"><Link href="/tournaments/new">Continue Setup</Link></UIButton>
          </div>
        </CardContent>
      </Card>
    );
  }
  // STATE 3: READY TO START
  else {
    return (
      <Card>
        <CardHeader><h2 className="text-lg font-medium text-muted-foreground">Ready to Start</h2></CardHeader>
        <CardContent>
          <div className="flex h-full flex-col items-center justify-center space-y-3 p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Your next event awaits!</h3>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">There are no active tournaments or drafts. Get started by creating a new one.</p>
            <UIButton asChild className="mt-4">
              <Link href="/tournaments/new">Create New Tournament</Link>
            </UIButton>
          </div>
        </CardContent>
      </Card>
    );
  }
}

function DashboardLayout({ children }) {
  return (
    <div className="mx-auto max-w-6xl">
      <WelcomeDialog />
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your club events and tournament drafts.
          </p>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        {children}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-muted-foreground">Quick Links</h2>
          </CardHeader>
          <CardContent>
            <ul className="-mx-3 -my-3 space-y-2 px-2">
              <li>
                <Link href="/roster" className="flex items-center justify-between p-3 transition-colors hover:bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Manage Club Roster</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
              <li>
                <Link href="/past-events" className="flex items-center justify-between p-3 transition-colors hover:bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">View Past Events</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
              <li>
                <Link href="/settings" className="flex items-center justify-between p-3 transition-colors hover:bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let hasDraft = false;
  let activeTournament = null;

  const spaces = await listSpaces();
  if (spaces.length === 0) {
    redirect("/onboarding");
  }

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
    <DashboardLayout>
      <DashboardContent activeTournament={activeTournament} hasDraft={hasDraft} />
    </DashboardLayout>
    // <div className="mx-auto max-w-6xl">
    //   <WelcomeDialog />
    //   <header className="mb-6 flex items-center justify-between">
    //     <h1 className="text-2xl font-bold">Event Dashboard</h1>
    //     <div className="flex items-center gap-2">
    //       {hasDraft ? (
    //         <>
    //           <UIButton asChild variant="outline">
    //             <Link href="/tournaments/new">Continue draft</Link>
    //           </UIButton>
    //           <StartNewTournamentButton label="Start New Tournament" />
    //         </>
    //       ) : (
    //         <UIButton asChild>
    //           <Link href="/tournaments/new">Create New Tournament</Link>
    //         </UIButton>
    //       )}
    //     </div>
    //   </header>

    //   <section className="grid gap-6 md:grid-cols-2">
    //     <Card>
    //       <CardHeader>
    //         <h2 className="text-lg font-semibold">Active Tournament</h2>
    //       </CardHeader>
    //       <CardContent>
    //         {activeTournament ? (
    //           <div className="flex items-center justify-between text-sm">
    //             <div>
    //               <div className="font-semibold">{activeTournament.name}</div>
    //               <div className="text-foreground/60">
    //                 {activeTournament.date
    //                   ? new Date(activeTournament.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    //                   : ""}
    //               </div>
    //             </div>
    //             <div className="flex items-center gap-2">
    //               <UIButton asChild variant="outline" size="sm">
    //                 <Link href={`/t/${activeTournament.id}/manage`}>Manage</Link>
    //               </UIButton>
    //               <UIButton asChild variant="outline" size="sm">
    //                 <Link href={`/t/${activeTournament.id}/live`}>Live</Link>
    //               </UIButton>
    //             </div>
    //           </div>
    //         ) : (
    //           <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
    //             <Trophy className="h-10 w-10 text-muted-foreground" />
    //             <h3 className="text-md font-semibold">No Active Tournament</h3>
    //             <p className="text-sm text-muted-foreground">
    //               Click the button below to start a new one.
    //             </p>
    //             {/* We can reuse the button logic from the header */}
    //             {hasDraft ? (
    //               <UIButton asChild className="mt-2">
    //                 <Link href="/tournaments/new">Continue Your Draft</Link>
    //               </UIButton>
    //             ) : (
    //               <UIButton asChild className="mt-2">
    //                 <Link href="/tournaments/new">Create New Tournament</Link>
    //               </UIButton>
    //             )}
    //           </div>
    //         )}
    //       </CardContent>
    //     </Card>

    //     <Card>
    //       <CardHeader>
    //         <h2 className="text-lg font-semibold">Quick Links</h2>
    //       </CardHeader>
    //       <CardContent>
    //         <ul className="text-sm leading-7">
    //           <li>
    //             <Link className="text-brand underline" href="/roster">
    //               Manage Club Roster
    //             </Link>
    //           </li>
    //           <li>
    //             <Link className="text-brand underline" href="/past-events">
    //               View Past Events
    //             </Link>
    //           </li>
    //           <li>
    //             <Link className="text-brand underline" href="/settings">
    //               Settings
    //             </Link>
    //           </li>
    //         </ul>
    //       </CardContent>
    //     </Card>
    //   </section>
    // </div>
  );
}


