// "use client";

// import { Button } from "@/components/ui/Button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// export default function Step1Details({ details, setDetails, goToStep }) {
//   const nameError = details.name.trim().length === 0;
//   const canGoToNext = !nameError;

//   return (
//     <Card>
//       <CardHeader>
//         <div className="font-semibold">Step 1: Details & Format</div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-4 md:grid-cols-2">
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Tournament Name</Label>
//             <input
//               className="w-full rounded-md border px-3 py-2"
//               value={details.name}
//               onChange={(e) => setDetails({ ...details, name: e.target.value })}
//             />
//             {nameError && <div className="mt-1 text-xs text-red-600">Name is required.</div>}
//           </div>
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Date</Label>
//             <input
//               type="date"
//               className="w-full rounded-md border px-3 py-2"
//               value={details.date}
//               onChange={(e) => setDetails({ ...details, date: e.target.value })}
//             />
//           </div>
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Entry Fee per Player</Label>
//             <input
//               className="w-full rounded-md border px-3 py-2"
//               value={details.entryFee}
//               onChange={(e) => setDetails({ ...details, entryFee: e.target.value })}
//             />
//           </div>
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Prize Money Details</Label>
//             <input
//               className="w-full rounded-md border px-3 py-2"
//               value={details.prize}
//               onChange={(e) => setDetails({ ...details, prize: e.target.value })}
//             />
//           </div>
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Format</Label>
//             <Select value={details.format} onValueChange={(v) => setDetails({ ...details, format: v })}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select format" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="League + Knockout">League + Knockout</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="text-sm">
//             <Label className="mb-1 block text-foreground/70">Knockout Stage</Label>
//             <Select value={details.knockoutStage} onValueChange={(v) => setDetails({ ...details, knockoutStage: v })}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select stage" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Semi-Finals">Semi-Finals</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="text-sm md:col-span-2">
//             <Label className="mb-1 block text-foreground/70">League Match Format</Label>
//             <input
//               className="w-full rounded-md border px-3 py-2"
//               value={details.leagueMatchFormat}
//               onChange={(e) => setDetails({ ...details, leagueMatchFormat: e.target.value })}
//             />
//           </div>
//         </div>
//         <div className="mt-5 flex justify-end gap-3">
//           <Button onClick={() => goToStep(2)} disabled={!canGoToNext}>
//             Next
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function Step1Details({ details, setDetails, goToStep }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (details.name.trim().length === 0) {
      newErrors.name = "Name is required.";
    }
    return newErrors;
  };

  const handleNext = () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      goToStep(2);
    }
  };


  return (
    <Card>
      <CardHeader className='mb-4'>
        <CardTitle>Tournament Details</CardTitle>
        <CardDescription>
          Start by providing the basic details for your tournament. This information will be displayed publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tournament-name">Tournament Name</Label>
            <Input
              id="tournament-name"
              placeholder="e.g., Summer Slam 2025"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !details.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {details.date ? format(new Date(details.date), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(details.date)}
                  onSelect={(date) => setDetails({ ...details, date: date.toISOString().slice(0, 10) })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-fee">Entry Fee per Player</Label>
            <Input
              id="entry-fee"
              placeholder="e.g., $20 or 1500 INR"
              value={details.entryFee}
              onChange={(e) => setDetails({ ...details, entryFee: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prize">Prize Money Details</Label>
            <Input
              id="prize"
              placeholder="e.g., Winner: $200, Runner-up: $100"
              value={details.prize}
              onChange={(e) => setDetails({ ...details, prize: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2">
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={details.format} onValueChange={(v) => setDetails({ ...details, format: v })}>
                      {/* FIX: Added w-full to make the select trigger expand */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="League + Knockout">League + Knockout</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Knockout Stage</Label>
                    <Select value={details.knockoutStage} onValueChange={(v) => setDetails({ ...details, knockoutStage: v })}>
                      {/* FIX: Added w-full to make the select trigger expand */}
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semi-Finals">Semi-Finals</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="league-format">League Match Format</Label>
                    <Input
                      id="league-format"
                      placeholder="e.g., Best of 3 sets"
                      value={details.leagueMatchFormat}
                      onChange={(e) => setDetails({ ...details, leagueMatchFormat: e.target.value })}
                    />
                </div>
             </div>
          </div>

        </div>
        <div className="mt-8 flex justify-end">
          <Button className='cursor-pointer' onClick={handleNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}