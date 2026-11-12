"use client";

import { useMemo } from "react";
import { Crown, Medal } from "lucide-react";
import { CompactBalance } from "@/components/game/balance-hero";
import { useGame } from "@/components/game/game-provider";
import { buildLeaderboard, formatCompact, formatInt } from "@/lib/game";

const TOP_COUNT = 10;

export function LeaderboardScreen() {
  const { state, username, now } = useGame();

  const rows = useMemo(
    () => buildLeaderboard(username, state.totalMined, state.startedAt, now),
    [username, state.totalMined, state.startedAt, now],
  );
  const player = rows.find((row) => row.isPlayer);
  const top = rows.slice(0, TOP_COUNT);
  const playerInTop = top.some((row) => row.isPlayer);
  const visible = playerInTop || !player ? top : [...top, player];

  return (
    <div className="flex flex-col gap-4 px-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-balance">Peringkat</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Berdasarkan total token yang sudah ditambang.
          </p>
        </div>
        <CompactBalance />
      </header>

      {player && (
        <section
          aria-label="Posisimu"
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary bg-primary/10 p-4"
        >
          <div>
            <p className="text-sm text-muted-foreground">Posisimu saat ini</p>
            <p className="text-4xl font-extrabold tabular-nums text-primary text-glow-gold">
              #{player.rank}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                dari {rows.length}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total ditambang</p>
            <p className="text-xl font-bold tabular-nums">
              {formatInt(player.total)} CT
            </p>
          </div>
        </section>
      )}

      <ol className="flex flex-col gap-2" aria-label="Daftar peringkat teratas">
        {visible.map((row, index) => {
          const gapBefore = index > 0 && row.rank - visible[index - 1].rank > 1;
          return (
            <li key={row.isPlayer ? "pemain" : row.name} className="flex flex-col gap-2">
              {gapBefore && (
                <span className="text-center text-muted-foreground" aria-hidden="true">
                  ...
                </span>
              )}
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  row.isPlayer
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tabular-nums">
                  {row.rank === 1 ? (
                    <Crown className="size-5 text-primary" aria-hidden="true" />
                  ) : row.rank <= 3 ? (
                    <Medal className="size-5 text-accent" aria-hidden="true" />
                  ) : null}
                  <span className={row.rank <= 3 ? "sr-only" : undefined}>
                    {row.rank}
                  </span>
                  {row.rank <= 3 && <span className="sr-only">Peringkat</span>}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.name}
                  {row.isPlayer && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      Kamu
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-bold tabular-nums text-primary">
                  {formatCompact(row.total)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-muted-foreground text-pretty">
        Penambang lain adalah pemain simulasi CT POOL. Peringkat diperbarui seiring kamu menambang.
      </p>
    </div>
  );
}
