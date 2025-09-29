// "use client";

// import { Button } from "@/components/ui/Button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";

// export default function Step2Players({ roster, selectedPlayerIds, setSelectedPlayerIds, goToStep }) {
//   const canGoToNext = selectedPlayerIds.size >= 4;

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div className="font-semibold">
//             Step 2: Select Players
//             <span className="ml-2 text-xs font-normal text-foreground/60">
//               {selectedPlayerIds.size}/{roster.length} selected
//             </span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="secondary"
//               onClick={() => setSelectedPlayerIds(new Set(roster.map((p) => p.id)))}
//               disabled={roster.length > 0 && selectedPlayerIds.size === roster.length}
//             >
//               Select all
//             </Button>
//             <Button
//               variant="secondary"
//               onClick={() => setSelectedPlayerIds(new Set())}
//               disabled={selectedPlayerIds.size === 0}
//             >
//               Clear all
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//           {roster.map((p) => {
//             const checked = selectedPlayerIds.has(p.id);
//             return (
//               <label
//                 key={p.id}
//                 className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors ${
//                   checked ? "border-brand bg-brand/5" : "border-black/10 bg-white hover:bg-gray-50"
//                 }`}
//               >
//                 <div>
//                   <div className="font-medium">{p.name}</div>
//                   <div className="text-xs text-foreground/60">
//                     Rank {p.skillRank} · {p.gender} · {p.age}
//                   </div>
//                 </div>
//                 <input
//                   type="checkbox"
//                   checked={checked}
//                   onChange={(e) => {
//                     const next = new Set(selectedPlayerIds);
//                     if (e.target.checked) next.add(p.id);
//                     else next.delete(p.id);
//                     setSelectedPlayerIds(next);
//                   }}
//                   className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
//                 />
//               </label>
//             );
//           })}
//         </div>

//         <div className="mt-5 flex items-center justify-between">
//           <Button variant="secondary" onClick={() => goToStep(1)}>
//             Back
//           </Button>
//           <div className="text-xs text-foreground/60">Select at least 4 players to continue.</div>
//           <Button onClick={() => goToStep(3)} disabled={!canGoToNext}>
//             Next
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // 1. Imported CardTitle and CardDescription
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function Step2Players({ roster, selectedPlayerIds, setSelectedPlayerIds, goToStep }) {
  const canGoToNext = selectedPlayerIds.size >= 4;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoster = roster.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      {/* 2. Refactored the header for a cleaner look and consistency with Step 1 */}
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className='mb-2'>Select Players</CardTitle>
            <CardDescription>Choose participants from your club roster.</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedPlayerIds.size} / {roster.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              className='cursor-pointer'
              onClick={() => setSelectedPlayerIds(new Set(roster.map((p) => p.id)))}
              disabled={roster.length > 0 && selectedPlayerIds.size === roster.length}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              className='cursor-pointer'
              size="sm"
              onClick={() => setSelectedPlayerIds(new Set())}
              disabled={selectedPlayerIds.size === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Input
          type="text"
          placeholder="Search for a player..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        <div className="relative max-h-[400px] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredRoster.map((p) => {
              const checked = selectedPlayerIds.has(p.id);
              return (
                <label
                  key={p.id}
                  htmlFor={p.id}
                  className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Rank {p.skillRank}</div>
                  </div>
                  <Checkbox
                    id={p.id}
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const next = new Set(selectedPlayerIds);
                      if (isChecked) {
                        next.add(p.id);
                      } else {
                        next.delete(p.id);
                      }
                      setSelectedPlayerIds(next);
                    }}
                  />
                </label>
              );
            })}
          </div>
          {filteredRoster.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              No players found.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button variant="secondary" className='cursor-pointer' onClick={() => goToStep(1)}>
            Back
          </Button>
          <div className="text-xs text-muted-foreground">Select at least 4 players to continue.</div>
          <Button className='cursor-pointer' onClick={() => goToStep(3)} disabled={!canGoToNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}