"use client";

import { Coins, Flame, Gauge, Pickaxe } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { formatDuration, formatInt, formatRate } from "@/lib/game";

export function BalanceHero() {
  const { state, perTap, perSecond, multiplier, now } = useGame();
  const boost = multiplier > 1 ? state.boost : null;

  return (
    <section aria-label="Saldo token" className="flex flex-col items-center gap-3 px-4 pt-2">
      <p className="text-sm font-medium tracking-wide text-muted-foreground">
        Saldo CT Token
      </p>
      <p
        className="text-glow-gold flex items-center gap-2 text-5xl font-extrabold leading-none tabular-nums text-primary sm:text-6xl"
        aria-label={`${formatInt(state.balance)} CT token`}
      >
        <Coins className="size-9 shrink-0 sm:size-11" aria-hidden="true" />
        <span>{formatInt(state.balance)}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums">
          <Pickaxe className="size-4 text-accent" aria-hidden="true" />
          {formatRate(perTap * multiplier)} / ketuk
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums">
          <Gauge className="size-4 text-accent" aria-hidden="true" />
          {formatRate(perSecond * multiplier)} / detik
        </span>
        {boost && (
          <span className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-sm font-bold tabular-nums text-primary">
            <Flame className="size-4" aria-hidden="true" />
            x{boost.mult} · {formatDuration(boost.until - now)}
          </span>
        )}
      </div>
    </section>
  );
}

export function CompactBalance() {
  const { state } = useGame();
  return (
    <p
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-base font-bold tabular-nums text-primary"
      aria-label={`Saldo ${formatInt(state.balance)} CT token`}
    >
      <Coins className="size-4" aria-hidden="true" />
      {formatInt(state.balance)}
    </p>
  );
}
