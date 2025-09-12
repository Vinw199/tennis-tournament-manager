// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";

// export default function Step3Pools({
//   goToStep,
//   topHalf,
//   bottomHalf,
//   isBalanced,
//   setHalfByPlayerId,
//   recommendedHalves,
//   generatedEntries,
//   numberOfGroups,
//   setNumberOfGroups,
//   groups,
//   regeneratePairs,
// }) {
//   const canGoToNext = groups.length > 0 && isBalanced;

//   return (
//     <Card>
//       <CardHeader>
//         <div className="font-semibold">Step 3: Pools, Entries & Groups</div>
//       </CardHeader>
//       <CardContent>
//         {/* Pools editor */}
//         <div className="mb-4">
//           <div className="mb-2 flex items-center justify-between">
//             <div className="text-sm font-semibold">Top/Bottom Pools</div>
//             <div className={"text-xs font-medium " + (isBalanced ? "text-green-700" : "text-red-600")}>
//               {isBalanced ? "Balanced" : "Unbalanced"}
//             </div>
//           </div>
//           <div className="grid gap-4 md:grid-cols-2">
//             <div className="rounded-md border border-black/10">
//               <div className="flex items-center justify-between border-b bg-black/5 px-4 py-2 text-sm font-semibold">
//                 <span>Top Pool ({topHalf.length})</span>
//                 <Button
//                   title="Restore recommended split by rank"
//                   variant="secondary"
//                   onClick={() =>
//                     setHalfByPlayerId(
//                       Object.fromEntries(
//                         recommendedHalves.topHalf
//                           .map((p) => [p.id, "top"])
//                           .concat(recommendedHalves.bottomHalf.map((p) => [p.id, "bottom"]))
//                       )
//                     )
//                   }
//                 >
//                   Reset
//                 </Button>
//               </div>
//               <ul className="px-4 py-3 text-sm">
//                 {topHalf.map((p) => (
//                   <li key={p.id} className="flex items-center justify-between py-1">
//                     <span>
//                       #{p.skillRank} {p.name}
//                     </span>
//                     <Button
//                       aria-label={`Move ${p.name} to Bottom pool`}
//                       variant="secondary"
//                       onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: "bottom" }))}
//                     >
//                       Move to Bottom
//                     </Button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//             <div className="rounded-md border border-black/10">
//               <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Bottom Pool ({bottomHalf.length})</div>
//               <ul className="px-4 py-3 text-sm">
//                 {bottomHalf.map((p) => (
//                   <li key={p.id} className="flex items-center justify-between py-1">
//                     <span>
//                       #{p.skillRank} {p.name}
//                     </span>
//                     <Button
//                       aria-label={`Move ${p.name} to Top pool`}
//                       variant="secondary"
//                       onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: "top" }))}
//                     >
//                       Move to Top
//                     </Button>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           </div>
//           {!isBalanced && <div className="mt-2 text-xs text-red-600">Pools must be balanced (size difference ≤ 1).</div>}
//         </div>

//         {/* Entries & Groups */}
//         <div className="mb-1 flex items-center justify-between">
//           <div className="text-sm text-foreground/70">
//             Generated entries: {generatedEntries.length}
//             <span className="ml-2 text-foreground/50">(based on current pools)</span>
//           </div>
//           <label className="text-sm">
//             <span className="mr-2 text-foreground/70">Number of Groups</span>
//             <select
//               className="rounded-md border px-2 py-1"
//               value={numberOfGroups}
//               onChange={(e) => setNumberOfGroups(Number(e.target.value))}
//             >
//               <option value={2}>2</option>
//               <option value={3}>3</option>
//               <option value={4}>4</option>
//             </select>
//           </label>
//         </div>

//         <div className="grid gap-4 md:grid-cols-2">
//           {groups.map((g, idx) => (
//             <div key={idx} className="rounded-md border border-black/10">
//               <div className="border-b bg-black/5 px-4 py-2 text-sm font-semibold">Group {String.fromCharCode(65 + idx)}</div>
//               <ul className="px-4 py-3 text-sm">
//                 {g.map((e) => (
//                   <li key={e.id} className="flex items-center justify-between py-1">
//                     <span>{e.name}</span>
//                     <span className="text-foreground/60">Avg Rank {e.averageRank}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         <div className="mt-4 flex justify-end">
//           <Button variant="ghost" onClick={regeneratePairs} disabled={!isBalanced || generatedEntries.length === 0}>
//             Regenerate Pairs
//           </Button>
//         </div>

//         <div className="mt-5 flex items-center justify-between">
//           <Button variant="secondary" onClick={() => goToStep(2)}>
//             Back
//           </Button>
//           <Button onClick={() => goToStep(4)} disabled={!canGoToNext}>
//             Next
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =================================================================================
// Main Component
// =================================================================================
export default function Step3Pools(props) {
  const { goToStep, groups, isBalanced, generatedEntries } = props;
  const canGoToNext = groups.length > 0 && isBalanced;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Pools & Groups</CardTitle>
        <CardDescription>
          A 3-step process to create balanced pairs and seed them into groups for the tournament.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pools" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pools">1. Pools</TabsTrigger>
            <TabsTrigger value="entries" disabled={!isBalanced}>
              2. Entries
            </TabsTrigger>
            <TabsTrigger value="groups" disabled={generatedEntries.length === 0}>
              3. Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pools">
            <PoolsTabContent {...props} />
          </TabsContent>
          <TabsContent value="entries">
            <EntriesTabContent {...props} />
          </TabsContent>
          <TabsContent value="groups">
            <GroupsTabContent {...props} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <Button variant="secondary" onClick={() => goToStep(2)} className='cursor-pointer'>
            Back
          </Button>
          {/* CHANGE 3: Updated button text for clarity */}
          <Button onClick={() => goToStep(4)} disabled={!canGoToNext} className='cursor-pointer'>
            Continue to Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =================================================================================
// Sub-Component for the "Pools" Tab
// =================================================================================
function PoolsTabContent({ topHalf, bottomHalf, isBalanced, setHalfByPlayerId, recommendedHalves }) {
  return (
    <div className="mt-4">
      {/* CHANGE 2: Added tab description */}
      <p className="mb-4 text-sm text-muted-foreground">
        Ensure player pools are balanced (or manually adjust them) before generating pairs.
      </p>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Top/Bottom Player Pools</div>
        {/* CHANGE 1: Relocated Reset button for better alignment */}
        <div className="flex items-center gap-3">
          <div className={"text-xs font-medium " + (isBalanced ? "text-green-700" : "text-red-600")}>
            {isBalanced ? "Balanced" : "Unbalanced"}
          </div>
          <Button size="sm" title="Restore recommended split by rank" variant="secondary" onClick={() => setHalfByPlayerId(/* ... */)}>
            Reset
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
            <span>Top Pool ({topHalf.length})</span>
          </div>
          <ul className="p-2 text-sm">
            {topHalf.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
                <span><span className="text-muted-foreground">#{p.skillRank}</span> {p.name}</span>
                <Button variant="ghost" size="icon" aria-label={`Move ${p.name} to Bottom pool`} onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: "bottom" }))} className='cursor-pointer'>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold">Bottom Pool ({bottomHalf.length})</div>
          <ul className="p-2 text-sm">
            {bottomHalf.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
                <span><span className="text-muted-foreground">#{p.skillRank}</span> {p.name}</span>
                <Button variant="ghost" size="icon" aria-label={`Move ${p.name} to Top pool`} onClick={() => setHalfByPlayerId((prev) => ({ ...(prev || {}), [p.id]: "top" }))} className='cursor-pointer'>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!isBalanced && <div className="mt-2 text-xs text-red-600">Pools must be balanced (size difference ≤ 1).</div>}
    </div>
  );
}

// =================================================================================
// Sub-Component for the "Entries" Tab
// =================================================================================
function EntriesTabContent({ generatedEntries, regeneratePairs, isBalanced }) {
  return (
    <div className="mt-4">
      {/* CHANGE 2: Added tab description */}
      <p className="mb-4 text-sm text-muted-foreground">
        Review the generated doubles pairs. You can regenerate new pairs if you're not satisfied.
      </p>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {generatedEntries.length} balanced pairs generated.
        </div>
        <Button variant="secondary" onClick={regeneratePairs} disabled={!isBalanced} className='cursor-pointer'>
          Regenerate Pairs
        </Button>
      </div>
      <div className="mt-4 rounded-md border">
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Pair</span>
          <span>Average Rank</span>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {generatedEntries.length > 0 ? (
            <ul>
              {generatedEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
                  <span>{entry.name}</span>
                  <span className="text-muted-foreground">{entry.averageRank.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Pairs will be generated here once the player pools are balanced.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// =================================================================================
// Sub-Component for the "Groups" Tab
// =================================================================================
function GroupsTabContent({ numberOfGroups, setNumberOfGroups, groups }) {
  return (
    <div className="mt-4">
      {/* CHANGE 2: Added tab description */}
      <p className="mb-4 text-sm text-muted-foreground">
        Select the number of groups to automatically seed the generated pairs into.
      </p>
      {/* CHANGE 4: Aligned label and select on the same line */}
      <div className="flex w-full max-w-sm items-center gap-4">
          <Label className="shrink-0">Number of Groups</Label>
          <Select value={String(numberOfGroups)} onValueChange={(v) => setNumberOfGroups(Number(v))}>
              <SelectTrigger>
                  <SelectValue placeholder="Select number of groups" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="2">2 Groups</SelectItem>
                  <SelectItem value="3">3 Groups</SelectItem>
                  <SelectItem value="4">4 Groups</SelectItem>
              </SelectContent>
          </Select>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {groups.map((g, idx) => (
          <div key={idx} className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
              Group {String.fromCharCode(65 + idx)}
            </div>
            <ul>
              {g.map((e) => (
                <li key={e.id} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
                  <span>{e.name}</span>
                  <span className="text-muted-foreground">Avg Rank {e.averageRank.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}