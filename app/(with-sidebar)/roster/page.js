"use client";

import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { listPlayers, upsertPlayer, deletePlayer } from "../../../lib/localStore";

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
        <Button onClick={() => valid && onSave({
          id: initial?.id || `p_${Date.now()}`,
          name,
          default_skill_rank: Number(rank),
          age: age === "" ? null : Number(age),
          gender: gender || null,
          profile_picture_url: url || null,
        })} disabled={!valid}>Save</Button>
      </div>
    </div>
  );
}

export default function ClubRoster() {
  const [players, setPlayers] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setPlayers(listPlayers());
  }, []);

  function openAdd() {
    setEditing(null);
    setShow(true);
  }
  function openEdit(p) {
    setEditing(p);
    setShow(true);
  }
  function save(p) {
    upsertPlayer(p);
    setPlayers(listPlayers());
    setShow(false);
  }
  function remove(id) {
    deletePlayer(id);
    setPlayers(listPlayers());
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


