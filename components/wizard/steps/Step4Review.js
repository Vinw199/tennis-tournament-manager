// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";

// export default function Step4Review({
//   details,
//   numberOfGroups,
//   checklist,
//   goToStep,
//   launchTournament,
//   canLaunch,
// }) {
//   return (
//     <Card>
//       <CardHeader>
//         <div className="font-semibold">Step 4: Review & Launch</div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-4 md:grid-cols-2">
//           <div>
//             <div className="mb-2 text-sm font-semibold">Summary</div>
//             <ul className="space-y-1 text-sm text-foreground/70">
//               <li>
//                 <span className="font-medium text-foreground">Name:</span> {details.name || "—"}
//               </li>
//               <li>
//                 <span className="font-medium text-foreground">Date:</span> {details.date}
//               </li>
//               <li>
//                 <span className="font-medium text-foreground">Format:</span> {details.format}
//               </li>
//               <li>
//                 <span className="font-medium text-foreground">Knockout:</span> {details.knockoutStage}
//               </li>
//               <li>
//                 <span className="font-medium text-foreground">Groups:</span> {numberOfGroups}
//               </li>
//             </ul>
//           </div>
//           <div>
//             <div className="mb-2 text-sm font-semibold">Match Checklist (per group)</div>
//             {checklist.map((groupMatches, idx) => (
//               <div key={idx} className="mb-3 rounded-md border border-black/10">
//                 <div className="border-b bg-black/5 px-3 py-2 text-xs font-semibold">
//                   Group {String.fromCharCode(65 + idx)}
//                 </div>
//                 <ul className="px-3 py-2 text-xs">
//                   {groupMatches.map((m, i) => (
//                     <li key={i} className="py-0.5">
//                       {m.entry1.name} vs {m.entry2.name}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="mt-5 flex items-center justify-between">
//           <Button variant="secondary" onClick={() => goToStep(3)}>
//             Back
//           </Button>
//           <Button onClick={launchTournament} disabled={!canLaunch}>
//             Launch Tournament
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }


"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, Trophy, ListChecks, Swords } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";

// A small sub-component for displaying a single stat, keeping the main component clean.
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </div>
      <p className="text-lg font-semibold">{value || "—"}</p>
    </div>
  );
}

export default function Step4Review({
  details,
  numberOfGroups,
  groups, // We'll use `groups` to display the final seedings
  totalPlayers, // Assumes `totalPlayers` is passed as a prop
  totalEntries, // Assumes `totalEntries` is passed as a prop
  goToStep,
  launchTournament,
  canLaunch,
  isLaunching,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Launch</CardTitle>
        <CardDescription>
          This is the final summary. Please review all details before launching the tournament.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 1. Top Section: Key Metrics in a dashboard-style grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={Trophy} label="Tournament Name" value={details.name} />
          <StatCard icon={CalendarDays} label="Date" value={details.date} />
          <StatCard icon={Users} label="Total Players" value={totalPlayers} />
          <StatCard icon={Swords} label="Total Entries" value={totalEntries} />
          <StatCard icon={ListChecks} label="Number of Groups" value={numberOfGroups} />
        </div>

        {/* Divider for visual separation */}
        <div className="my-6 border-t"></div>

        {/* 2. Bottom Section: Displaying the Final Groups */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Final Groups</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((g, idx) => (
              <div key={idx} className="rounded-md border">
                <div className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
                  Group {String.fromCharCode(65 + idx)}
                </div>
                <ul className="max-h-48 overflow-y-auto p-1">
                  {g.map((e) => (
                    <li key={e.id} className="rounded-md px-3 py-2 text-sm">
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button variant="secondary" onClick={() => goToStep(3)} className='cursor-pointer'>
            Back
          </Button>
          <SubmitButton onClick={launchTournament} disabled={!canLaunch} size="lg" isPending={isLaunching} pendingText="Launching Tournament...">
            Launch Tournament
          </SubmitButton>
        </div>
      </CardContent>
    </Card>
  );
}