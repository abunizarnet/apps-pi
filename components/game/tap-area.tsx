"use client";

import { useCallback, useRef, useState } from "react";
import { Pickaxe } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { formatRate } from "@/lib/game";

interface Floater {
  id: number;
  x: number;
  y: number;
  value: number;
}

const MAX_FLOATERS = 14;

export function TapArea() {
  const { tap } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [tapKey, setTapKey] = useState(0);

  const mine = useCallback(
    (x: number, y: number) => {
      const value = tap();
      idRef.current += 1;
      const id = idRef.current;
      const jitter = (Math.random() - 0.5) * 36;
      setFloaters((current) =>
        [...current, { id, x: x + jitter, y, value }].slice(-MAX_FLOATERS),
      );
      setTapKey(id);
      setTimeout(() => {
        setFloaters((current) => current.filter((item) => item.id !== id));
      }, 900);
    },
    [tap],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mine(event.clientX - rect.left, event.clientY - rect.top - 24);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mine(rect.width / 2, rect.height / 3);
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto my-4 size-64 select-none sm:size-72"
    >
      <div
        className="ring-spin pointer-events-none absolute -inset-3 rounded-full border-2 border-dashed border-accent/50"
        aria-hidden="true"
      />
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Ketuk untuk menambang CT token"
        className="coin relative flex size-full items-center justify-center rounded-full focus-visible:outline-4 focus-visible:outline-offset-8 focus-visible:outline-ring"
      >
        <span
          key={tapKey}
          className={`${tapKey > 0 ? "pick-swing" : ""} flex items-center justify-center`}
        >
          <Pickaxe
            className="size-28 text-primary drop-shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_60%,transparent)] sm:size-32"
            strokeWidth={1.6}
            aria-hidden="true"
          />
        </span>
        <span
          key={`flash-${tapKey}`}
          className={`${tapKey > 0 ? "tap-flash" : "opacity-0"} pointer-events-none absolute inset-0 rounded-full bg-accent/40`}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <span className="shine-bar absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
        </span>
      </button>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {floaters.map((floater) => (
          <span
            key={floater.id}
            className="float-up absolute text-2xl font-extrabold tabular-nums text-primary text-glow-gold"
            style={{ left: floater.x, top: floater.y }}
          >
            +{formatRate(floater.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
