import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Skeleton } from "../../../components/ui/skeleton";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/Button";
import { getActiveSpaceId } from "@/lib/supabase/spaces";

export default async function PastEvents() {
  const supabase = await createClient();
  const spaceId = await getActiveSpaceId();
  let tournaments = [];
  if (spaceId) {
    const { data } = await supabase
      .from("tournaments")
      .select("id, name, date")
      .eq("space_id", spaceId)
      .eq("status", "completed")
      .order("date", { ascending: false });
    tournaments = data || [];
  }
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Archive</h1>
        <p className="text-sm text-foreground/70">Finished tournaments for this space.</p>
      </header>
      {tournaments.length === 0 ? (
        <Card>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <p className="text-sm text-foreground/70">No completed tournaments yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="space-y-2">
              {tournaments.map((t) => {
                const formattedDate = t.date
                  ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "";
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-md px-4 py-3 hover:bg-muted/50">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-foreground/60">{formattedDate}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/past-events/${t.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
