"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Minimal bracket renderer for 2 rounds (Semis -> Final)
// Expects model: { rounds: [...], matches: [...] }

export default function Bracket({ model, onOpenScore }) {
  const { rounds, matches } = model;
  const matchById = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // Resolve slot participants from sources (winners)
  const resolvedMatches = useMemo(() => {
    const clone = matches.map((m) => ({ ...m, slots: m.slots.map((s) => ({ ...s })) }));
    const byId = new Map(clone.map((m) => [m.id, m]));
    function winnerOf(m) {
      if (
        m.status === "completed" &&
        typeof m.entry1_score === "number" &&
        typeof m.entry2_score === "number"
      ) {
        return m.entry1_score > m.entry2_score ? m.slots[0].participant : m.slots[1].participant;
      }
      return null;
    }
    for (const m of clone) {
      m.slots.forEach((slot, idx) => {
        if (!slot.participant && slot.source?.type === "winner") {
          const src = byId.get(slot.source.matchId);
          const win = src ? winnerOf(src) : null;
          if (win) m.slots[idx].participant = win;
        }
      });
    }
    return clone;
  }, [matches]);

  // Layout measurement for simple SVG connectors between rounds
  const containerRef = useRef(null);
  const matchRefs = useRef(new Map());
  const finalSlotRefs = useRef({ 0: null, 1: null });
  const [lines, setLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const finalColumnRef = useRef(null);
  const finalCardRef = useRef(null);

  function computeLines() {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const next = [];
    // Ensure SVG spans the scrollable content
    setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });

    let sf1 = matchRefs.current.get("sf1");
    let sf2 = matchRefs.current.get("sf2");
    // Fallback: use the first two semis in insertion order
    if (!sf1 || !sf2) {
      const arr = Array.from(matchRefs.current.values());
      sf1 = sf1 || arr[0];
      sf2 = sf2 || arr[1];
    }
    const final0 = finalSlotRefs.current[0];
    const final1 = finalSlotRefs.current[1];
    if (sf1 && final0) {
      const a = sf1.getBoundingClientRect();
      const b = final0.getBoundingClientRect();
      next.push({
        x1: a.right - cRect.left,
        y1: a.top + a.height / 2 - cRect.top,
        x2: b.left - cRect.left,
        y2: b.top + b.height / 2 - cRect.top,
      });
    }
    if (sf2 && final1) {
      const a = sf2.getBoundingClientRect();
      const b = final1.getBoundingClientRect();
      next.push({
        x1: a.right - cRect.left,
        y1: a.top + a.height / 2 - cRect.top,
        x2: b.left - cRect.left,
        y2: b.top + b.height / 2 - cRect.top,
      });
    }
    setLines(next);
  }

  useEffect(() => {
    const onResize = () => computeLines();
    window.addEventListener("resize", onResize);
    // Observe size changes of key elements
    const ro = new ResizeObserver(() => computeLines());
    if (containerRef.current) ro.observe(containerRef.current);
    const maybeObserve = (el) => {
      if (el) ro.observe(el);
    };
    // Delay to ensure refs are set
    const raf = requestAnimationFrame(() => {
      computeLines();
      maybeObserve(matchRefs.current.get("sf1"));
      maybeObserve(matchRefs.current.get("sf2"));
      maybeObserve(finalSlotRefs.current[0]);
      maybeObserve(finalSlotRefs.current[1]);
    });
    const tid = setTimeout(() => computeLines(), 50);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(tid);
    };
  }, [resolvedMatches, rounds.length]);

  return (
    <div className="relative overflow-auto" ref={containerRef}>
      {/* SVG connectors */}
      <svg
        className="pointer-events-none absolute top-0 left-0 z-10 text-accent"
        width={svgSize.w}
        height={svgSize.h}
        viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
        aria-hidden
      >
        {lines.map((l, i) => (
          <path
            key={i}
            d={`M ${l.x1} ${l.y1} C ${(l.x1 + l.x2) / 2} ${l.y1}, ${(l.x1 + l.x2) / 2} ${l.y2}, ${l.x2} ${l.y2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Two-column layout: headings row, then content row */}
      {rounds.length === 2 ? (
        <div className="relative">
          <div className="mb-2 grid grid-cols-2">
            <div className="text-sm font-semibold">{rounds[0].name}</div>
            <div className="text-sm font-semibold">{rounds[1].name}</div>
          </div>
          <div className="relative grid grid-cols-2 items-stretch gap-6 z-0">
            {/* Semis Column (content only) */}
            <div className="relative min-w-[260px]">
              <div className="space-y-4">
              {rounds[0].matches.map((id) => {
                const m = resolvedMatches.find((x) => x.id === id) || matchById.get(id);
                return (
                  <div
                    key={id}
                    ref={(el) => matchRefs.current.set(id, el)}
                    className="rounded-md border border-black/10 bg-white p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
                      <span>{m.name}</span>
                      {onOpenScore && (
                        <button className="rounded-md border px-2 py-1 text-[11px]" onClick={() => onOpenScore(m)}>
                          {m.status === "completed" ? "Edit" : "Score"}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span>{m.slots[0].participant?.name || "TBD"}</span>
                        {typeof m.entry1_score === "number" && (
                          <span className="text-foreground/60">{m.entry1_score}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{m.slots[1].participant?.name || "TBD"}</span>
                        {typeof m.entry2_score === "number" && (
                          <span className="text-foreground/60">{m.entry2_score}</span>
                        )}
                      </div>
                    </div>
                  </div>
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
                  const finalCompleted =
                    m.status === "completed" &&
                    typeof m.entry1_score === "number" &&
                    typeof m.entry2_score === "number";
                  const slot0Winner = finalCompleted && m.entry1_score > m.entry2_score;
                  const slot1Winner = finalCompleted && m.entry2_score > m.entry1_score;
                  return (
                    <div key={id} ref={finalCardRef} className="rounded-md border border-black/10 bg-white p-3 text-sm">
                      <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
                        <span>{m.name}</span>
                        {onOpenScore && (
                          <button className="rounded-md border px-2 py-1 text-[11px]" onClick={() => onOpenScore(m)}>
                            {m.status === "completed" ? "Edit" : "Score"}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div ref={(el) => (finalSlotRefs.current[0] = el)} className={`flex items-center justify-between ${slot0Winner ? "rounded bg-accent/20" : ""}`}>
                          <span>{m.slots[0].participant?.name || "TBD"}</span>
                          {typeof m.entry1_score === "number" && <span className="text-foreground/60">{m.entry1_score}</span>}
                        </div>
                        <div ref={(el) => (finalSlotRefs.current[1] = el)} className={`flex items-center justify-between ${slot1Winner ? "rounded bg-accent/20" : ""}`}>
                          <span>{m.slots[1].participant?.name || "TBD"}</span>
                          {typeof m.entry2_score === "number" && <span className="text-foreground/60">{m.entry2_score}</span>}
                        </div>
                        {finalCompleted && (
                          <div className="mt-2 text-[11px] font-semibold text-accent">Champion: {slot0Winner ? m.slots[0].participant?.name : m.slots[1].participant?.name}</div>
                        )}
                      </div>
                    </div>
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
                    <div key={id} className="rounded-md border border-black/10 bg-white p-3 text-sm">
                      <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
                        <span>{m.name}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span>{m.slots[0].participant?.name || "TBD"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{m.slots[1].participant?.name || "TBD"}</span>
                        </div>
                      </div>
                    </div>
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


