import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getActiveSpaceId } from "@/lib/supabase/spaces";
import { computeStandings } from "../domain/tournament/standings";
import { createFinalAction, createKnockoutStageAction } from "../app/t/actions";

export function useTournamentManager(initialData) {
  const { tournament: initialTournament, entries: initialEntries, matches: initialMatches } = initialData;
  const tournamentId = initialTournament.id;

  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tournament, setTournament] = useState(initialTournament);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeMatch, setActiveMatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [forfeitMatch, setForfeitMatch] = useState(null);

  const [bracket, setBracket] = useState(null);
  const [bracketRefresh, setBracketRefresh] = useState(0);
  const [semisExist, setSemisExist] = useState(false);
  const [finalExists, setFinalExists] = useState(false);
  const [semisCompleted, setSemisCompleted] = useState(false);
  const [finalCompleted, setFinalCompleted] = useState(false);
  const [isGeneratingKnockouts, setIsGeneratingKnockouts] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);

  // Initial data hydration and admin check
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      // Determine admin status
      const supabase = createClient();
      const spaceId = await getActiveSpaceId();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && spaceId) {
        const { data: mem } = await supabase
          .from("space_members")
          .select("role")
          .eq("space_id", spaceId)
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(mem?.role === "admin");
      }

      // Hydrate matches with entry data
      const entryById = new Map(initialEntries.map((e) => [e.id, e]));
      const hydratedMatches = initialMatches.map((m) => ({
        ...m,
        entry1: entryById.get(m.entry1_id),
        entry2: entryById.get(m.entry2_id),
      }));
      setMatches(hydratedMatches);

      // Derive groups from matches
      const groupLabels = Array.from(new Set(hydratedMatches.map((m) => m.round).filter((r) => r?.startsWith("Group "))));
      const derivedGroups = groupLabels.map((label) => {
        const set = new Map();
        hydratedMatches
          .filter((m) => m.round === label)
          .forEach((m) => {
            if (m.entry1) set.set(m.entry1.id, m.entry1);
            if (m.entry2) set.set(m.entry2.id, m.entry2);
          });
        return Array.from(set.values());
      });
      setGroups(derivedGroups);

      setLoading(false);
    })();
  }, [initialData, initialEntries, initialMatches]);

  const standingsByGroup = useMemo(() => {
    return groups.map((_, gi) => {
      const groupLabel = `Group ${String.fromCharCode(65 + gi)}`;
      const groupMatches = matches.filter((m) => m.round === groupLabel);

      // 1. Calculate the standings
      const standings = computeStandings(groupMatches);

      // 2. Determine if this specific group is completed
      const isCompleted = groupMatches.length > 0 && groupMatches.every((m) => m.status === "completed");

      // 3. Return an object with both pieces of data
      return { standings, isCompleted };
    });
  }, [groups, matches]);

  const allGroupMatchesCompleted = useMemo(() => {
    const groupRounds = groups.map((_, gi) => `Group ${String.fromCharCode(65 + gi)}`);
    return matches
      .filter((m) => groupRounds.includes(m.round))
      .every((m) => m.status === "completed");
  }, [groups, matches]);

  // Bracket logic useEffect...
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      // Build bracket model from DB if present; otherwise scaffold with TBD
      const { data: entries } = await supabase.from("entries").select("id,name").eq("tournament_id", tournamentId);
      const entryById = new Map(entries?.map((e) => [e.id, e]) || []);

      const { data: semis } = await supabase
        .from("matches")
        .select("id, entry1_id, entry2_id, entry1_score, entry2_score, status")
        .eq("tournament_id", tournamentId)
        .eq("round", "Semi-Finals");
      const hasSemis = Array.isArray(semis) && semis.length >= 2;
      const semisDone = !!hasSemis && semis.every((m) => m.status === "completed" && typeof m.entry1_score === "number" && typeof m.entry2_score === "number");
      setSemisExist(hasSemis);
      setSemisCompleted(semisDone);
      const { data: final } = await supabase
        .from("matches")
        .select("id, entry1_id, entry2_id, entry1_score, entry2_score, status")
        .eq("tournament_id", tournamentId)
        .eq("round", "Final")
        .maybeSingle();
      setFinalExists(!!final);
      const model = { rounds: [{ name: "Semi-Finals", matches: ["sf1", "sf2"] }, { name: "Final", matches: ["final"] }], matches: [] };

      // Semis (use DB if available; else TBD)
      const s1 = semis?.[0];
      const s2 = semis?.[1];
      model.matches.push({
        id: "sf1",
        dbId: s1?.id || null,
        name: "Semi-Final 1",
        slots: [
          { participant: s1 ? entryById.get(s1.entry1_id) : null },
          { participant: s1 ? entryById.get(s1.entry2_id) : null },
        ],
        entry1_score: s1?.entry1_score ?? null,
        entry2_score: s1?.entry2_score ?? null,
        status: s1?.status ?? "pending",
      });
      model.matches.push({
        id: "sf2",
        dbId: s2?.id || null,
        name: "Semi-Final 2",
        slots: [
          { participant: s2 ? entryById.get(s2.entry1_id) : null },
          { participant: s2 ? entryById.get(s2.entry2_id) : null },
        ],
        entry1_score: s2?.entry1_score ?? null,
        entry2_score: s2?.entry2_score ?? null,
        status: s2?.status ?? "pending",
      });

      // Final (use DB if available; else TBD with sources)
      model.matches.push({
        id: "final",
        dbId: final?.id || null,
        name: "Final",
        slots: [
          { participant: final ? entryById.get(final.entry1_id) : null, source: { type: "winner", matchId: "sf1" } },
          { participant: final ? entryById.get(final.entry2_id) : null, source: { type: "winner", matchId: "sf2" } },
        ],
        entry1_score: final?.entry1_score ?? null,
        entry2_score: final?.entry2_score ?? null,
        status: final?.status ?? "pending",
      });

      setBracket(model);
      const done = final && final.status === "completed" && typeof final.entry1_score === "number" && typeof final.entry2_score === "number";
      setFinalCompleted(!!done);
    })();
  }, [allGroupMatchesCompleted, bracketRefresh, tournamentId]);

  // Handler functions
  async function saveScore(data) {
    if (!isAdmin) {
      alert("Only admins can record scores.");
      setShowModal(false);
      return;
    }
    if (!activeMatch) return;
    // Try bracket first
    if (bracket && bracket.matches.some((m) => m.id === activeMatch.id)) {
      setBracket((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === activeMatch.id
            ? { ...m, ...data, status: "completed" }
            : m
        ),
      }));
      // Persist bracket match score to DB if mapped
      const supabase = createClient();
      if (activeMatch.dbId) {
        await supabase
          .from("matches")
          .update({ entry1_score: data.entry1_score, entry2_score: data.entry2_score, status: "completed" })
          .eq("id", activeMatch.dbId);
      }
      // Refresh bracket from DB
      setShowModal(false);
      setBracketRefresh((x) => x + 1);
      return;
    }
    // Otherwise update group stage matches
    setMatches((prev) => prev.map((m) => (m.id === activeMatch.id ? { ...m, ...data, status: "completed" } : m)));
    // Persist to DB
    const supabase = createClient();
    await supabase
      .from("matches")
      .update({ entry1_score: data.entry1_score, entry2_score: data.entry2_score, status: "completed" })
      .eq("id", activeMatch.id);
    setShowModal(false);
  }

  async function handleGenerateKnockoutStage() {
    setIsGeneratingKnockouts(true);
    const res = await createKnockoutStageAction({ tournamentId });
    if (res?.error) toast.error(res.error);
    setBracketRefresh((x) => x + 1);
    setIsGeneratingKnockouts(false);
  }

  async function handleGenerateFinal() {
    setIsGeneratingFinal(true);
    const res = await createFinalAction({ tournamentId });
    if (res?.error) toast.error(res.error);
    setBracketRefresh((x) => x + 1);
    setIsGeneratingFinal(false);
  }

  function requestForfeit(m, winnerEntryId) {
    setForfeitMatch({ match: m, winnerEntryId });
  }

  function openScore(m) {
    setActiveMatch(m);
    setShowModal(true);
  }

  function confirmForfeit() {
    const { match: m, winnerEntryId } = forfeitMatch || {};
    if (!m) return;
    const entry1Wins = m.entry1.id === winnerEntryId;
    setMatches((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
            ...x,
            entry1_score: entry1Wins ? 4 : 0,
            entry2_score: entry1Wins ? 0 : 4,
            status: "completed",
          }
          : x
      )
    );
    setForfeitMatch(null);
  }

  return {
    // State and Data
    loading,
    error,
    isAdmin,
    tournament,
    groups,
    matches,
    standingsByGroup,
    bracket,
    activeMatch,
    showModal,
    forfeitMatch,
    allGroupMatchesCompleted,
    semisExist,
    finalExists,
    semisCompleted,
    finalCompleted,
    isGeneratingKnockouts,
    isGeneratingFinal,

    // Actions and Setters
    openScore,
    saveScore,
    setShowModal,
    setForfeitMatch,
    setActiveMatch,
    confirmForfeit,
    handleGenerateKnockoutStage,
    handleGenerateFinal,
  };
}