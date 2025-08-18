"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { createClient } from "@/utils/supabase/client";

function PlayerForm({ initial, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [rank, setRank] = useState(initial?.default_skill_rank || 1);
  const [age, setAge] = useState(initial?.age || "");
  const [gender, setGender] = useState(initial?.gender || "");
  const [url, setUrl] = useState(initial?.profile_picture_url || "");
  const valid = name.trim().length > 0 && Number(rank) > 0;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm">
        <div className="mb-1 text-foreground/70">Name</div>
        <input className="w-full rounded-md border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="text-sm">
        <div className="mb-1 text-foreground/70">Skill Rank</div>
        <input type="number" min={1} className="w-full rounded-md border px-3 py-2" value={rank} onChange={(e) => setRank(e.target.value)} />
      </label>
      <label className="text-sm">
        <div className="mb-1 text-foreground/70">Age</div>
        <input type="number" min={0} className="w-full rounded-md border px-3 py-2" value={age} onChange={(e) => setAge(e.target.value)} />
      </label>
      <label className="text-sm">
        <div className="mb-1 text-foreground/70">Gender</div>
        <select className="w-full rounded-md border px-3 py-2" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">—</option>
          <option>F</option>
          <option>M</option>
          <option>Other</option>
        </select>
      </label>
      <label className="text-sm md:col-span-2">
        <div className="mb-1 text-foreground/70">Profile Picture URL (optional)</div>
        <input className="w-full rounded-md border px-3 py-2" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
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
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
    async function load() {
      const { data, error } = await supabase
        .from("players")
        .select("id,name,default_skill_rank,age,gender,profile_picture_url")
        .eq("space_id", spaceId)
        .order("name", { ascending: true });
      if (!error && data) setPlayers(data);
    }
    load();
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
    const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
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
    const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
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

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-foreground/70">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Skill Rank</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-foreground/70" colSpan={5}>Empty state: add players to build your roster.</td>
              </tr>
            ) : (
              players.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.default_skill_rank}</td>
                  <td className="px-4 py-3">{p.age ?? "—"}</td>
                  <td className="px-4 py-3">{p.gender ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="secondary" onClick={() => remove(p.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={show} title={editing ? "Edit Player" : "Add Player"} onClose={() => setShow(false)}>
        <PlayerForm initial={editing} onSave={save} />
      </Modal>
    </div>
  );
}


