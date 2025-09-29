"use client";

import { useState, useEffect } from "react";

export function BracketConnectors({ containerRef, sf1Ref, sf2Ref, finalRef }) {
  const [lines, setLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function computeLines() {
      const sf1 = sf1Ref.current;
      const sf2 = sf2Ref.current;
      const finalCard = finalRef.current;
      const cRect = container.getBoundingClientRect();
      const nextLines = [];

      // Ensure SVG spans the entire scrollable content area
      setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });

      if (sf1 && sf2 && finalCard) {
        const a = sf1.getBoundingClientRect();
        const b = sf2.getBoundingClientRect();
        const f = finalCard.getBoundingClientRect();
        
        const finalLeftX = f.left - cRect.left;
        const finalCenterY = f.top + f.height / 2 - cRect.top;

        nextLines.push({
          x1: a.right - cRect.left,
          y1: a.top + a.height / 2 - cRect.top,
          x2: finalLeftX,
          y2: finalCenterY,
        });
        nextLines.push({
          x1: b.right - cRect.left,
          y1: b.top + b.height / 2 - cRect.top,
          x2: finalLeftX,
          y2: finalCenterY,
        });
      }
      setLines(nextLines);
    }
    
    // Initial computation and setting up observers
    const raf = requestAnimationFrame(computeLines);
    const ro = new ResizeObserver(computeLines);
    ro.observe(container);
    if (sf1Ref.current) ro.observe(sf1Ref.current);
    if (sf2Ref.current) ro.observe(sf2Ref.current);
    if (finalRef.current) ro.observe(finalRef.current);
    
    window.addEventListener("resize", computeLines);

    return () => {
      window.removeEventListener("resize", computeLines);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef, sf1Ref, sf2Ref, finalRef]);


  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 z-0 text-primary"
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
  );
}