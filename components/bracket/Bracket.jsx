"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MatchCard } from "./MatchCard";
import { BracketConnectors } from "./BracketConnectors";

// hooks
import { useResolvedBracket } from "@/hooks/useResolvedBracket";

// Minimal bracket renderer for 2 rounds (Semis -> Final)
// Expects model: { rounds: [...], matches: [...] }

export default function Bracket({ model, onOpenScore }) {
  const { rounds, matches } = model;
  const matchById = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // Resolve slot participants from sources (winners)
  const resolvedMatches = useResolvedBracket(matches);

  // Layout measurement for simple SVG connectors between rounds
  const containerRef = useRef(null);

  const finalColumnRef = useRef(null);
  const finalCardRef = useRef(null);

  // Refs for semi-final matches to pass to the connector component
  const sf1Ref = useRef(null);
  const sf2Ref = useRef(null);

  return (
    <div className="relative overflow-auto" ref={containerRef}>

      {/* Change: The new component handles all SVG logic */}
      <BracketConnectors
        containerRef={containerRef}
        sf1Ref={sf1Ref}
        sf2Ref={sf2Ref}
        finalRef={finalCardRef}
      />

      {/* Two-column layout: headings row, then content row */}
      {rounds.length === 2 ? (
        <div className="relative">
          <div className="mb-2 grid grid-cols-2">
            <div className="text-base font-bold tracking-wide">{rounds[0].name}</div>
            <div className="text-base font-bold tracking-wide">{rounds[1].name}</div>
          </div>
          <div className="relative grid grid-cols-2 items-stretch gap-6 z-0">
            {/* Semis Column (content only) */}
            <div className="relative min-w-[260px]">
              <div className="space-y-4">
                {rounds[0].matches.map((id, index) => {
                  const m = resolvedMatches.find((x) => x.id === id) || matchById.get(id);
                  const ref = index === 0 ? sf1Ref : sf2Ref
                  return (
                    <MatchCard
                      key={id}
                      ref={ref}
                      match={m}
                      onOpenScore={onOpenScore}
                    />
                  );
                })}
              </div>

              {/* close Semis column */}
            </div>

            {/* Final Column - vertically centered */}
            <div ref={finalColumnRef} className="relative min-w-[260px] flex items-center">
              <div className="w-full">
                {rounds[1].matches.map((id) => {
                  const m = resolvedMatches.find((x) => x.id === id) || matchById.get(id);
                  return (
                    <MatchCard key={id} ref={finalCardRef} match={m} onOpenScore={onOpenScore} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex items-start gap-6">
          {rounds.map((round) => (
            <div key={round.name} className="min-w-[260px]">
              <div className="mb-2 text-sm font-semibold">{round.name}</div>
              <div className="space-y-4">
                {round.matches.map((id) => {
                  const m = resolvedMatches.find((x) => x.id === id) || matchById.get(id);
                  return (
                    <MatchCard key={id} match={m} onOpenScore={onOpenScore} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


