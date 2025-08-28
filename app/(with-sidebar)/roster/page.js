"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Skeleton } from "../../../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
// Removed shadcn Input usage per design feedback
import { Label } from "../../../components/ui/label";
import { getActiveSpaceId } from "@/lib/supabase/spaces";

function PlayerForm({ initial, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [rank, setRank] = useState(initial?.default_skill_rank || 1);
  const [age, setAge] = useState(initial?.age || "");
  const [gender, setGender] = useState(initial?.gender || "");
  const [url, setUrl] = useState(initial?.profile_picture_url || "");
  const valid = name.trim().length > 0 && Number(rank) > 0;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="text-sm">
        <Label className="mb-1 text-foreground/70 block">Name</Label>
        <input className="w-full rounded-md border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="text-sm">
        <Label className="mb-1 text-foreground/70 block">Skill Rank</Label>
        <input type="number" min={1} className="w-full rounded-md border px-3 py-2" value={rank} onChange={(e) => setRank(e.target.value)} />
      </div>
      <div className="text-sm">
        <Label className="mb-1 text-foreground/70 block">Age</Label>
        <input type="number" min={0} className="w-full rounded-md border px-3 py-2" value={age} onChange={(e) => setAge(e.target.value)} />
      </div>
      <label className="text-sm">
        <div className="mb-1 text-foreground/70">Gender</div>
        <select className="w-full rounded-md border px-3 py-2" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">—</option>
          <option>F</option>
          <option>M</option>
          <option>Other</option>
        </select>
      </label>
      <div className="text-sm md:col-span-2">
        <Label className="mb-1 text-foreground/70 block">Profile Picture URL (optional)</Label>
        <input className="w-full rounded-md border px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button onClick={() => {
          if (!valid) return;
          const payload = {
            name,
            default_skill_rank: Number(rank),
            age: age === "" ? null : Number(age),
            gender: gender || null,
            profile_picture_url: url || null,
          };
          if (initial?.id) {
            payload.id = initial.id;
          }
          onSave(payload);
        }} disabled={!valid}>Save</Button>
      </div>
    </div>
  );
}

export default function ClubRoster() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(async () => {
    const supabase = createClient();
    const spaceId = await getActiveSpaceId();
    async function load() {
      const { data, error } = await supabase
        .from("players")
        .select("id,name,default_skill_rank,age,gender,profile_picture_url")
        .eq("space_id", spaceId)
        .order("name", { ascending: true });
      if (!error && data) setPlayers(data);
    }
    load().finally(() => setIsLoading(false));
  }, []);

  function openAdd() {
    setEditing(null);
    setShow(true);
  }
  function openEdit(p) {
    setEditing(p);
    setShow(true);
  }
  async function save(p) {
    const supabase = createClient();
    const spaceId = await getActiveSpaceId();
    if (p.id) {
      const { error } = await supabase
        .from("players")
        .update({
          name: p.name,
          default_skill_rank: p.default_skill_rank,
          age: p.age,
          gender: p.gender,
          profile_picture_url: p.profile_picture_url,
        })
        .eq("id", p.id)
        .eq("space_id", spaceId);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase
        .from("players")
        .insert([{ ...p, space_id: spaceId }]);
      if (error) return alert(error.message);
    }
    // reload list
    const { data } = await supabase
      .from("players")
      .select("id,name,default_skill_rank,age,gender,profile_picture_url")
      .eq("space_id", spaceId)
      .order("name", { ascending: true });
    setPlayers(data || []);
    setShow(false);
  }

  async function remove(id) {
    const supabase = createClient();
    const spaceId = await getActiveSpaceId();
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", id)
      .eq("space_id", spaceId);
    if (error) return alert(error.message);
    const { data } = await supabase
      .from("players")
      .select("id,name,default_skill_rank,age,gender,profile_picture_url")
      .eq("space_id", spaceId)
      .order("name", { ascending: true });
    setPlayers(data || []);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Club Roster</h1>
        <Button onClick={openAdd}>Add Player</Button>
      </header>

      <div className="rounded-lg border bg-card text-card-foreground">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4 py-3">Name</TableHead>
                <TableHead className="px-4 py-3">Skill Rank</TableHead>
                <TableHead className="px-4 py-3">Age</TableHead>
                <TableHead className="px-4 py-3">Gender</TableHead>
                <TableHead className="px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-3 text-foreground/70" colSpan={5}>Empty state: add players to build your roster.</TableCell>
                </TableRow>
              ) : (
                players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3">{p.name}</TableCell>
                    <TableCell className="px-4 py-3">{p.default_skill_rank}</TableCell>
                    <TableCell className="px-4 py-3">{p.age ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3">{p.gender ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                        <Button variant="secondary" onClick={() => remove(p.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={show} onOpenChange={(v) => !v && setShow(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Player" : "Add Player"}</DialogTitle>
          </DialogHeader>
          <PlayerForm initial={editing} onSave={save} />
        </DialogContent>
      </Dialog>
    </div>
  );
}


