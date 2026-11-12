"use client";

import { CalendarCheck, Check, Flame, Gift, Timer } from "lucide-react";
import { CompactBalance } from "@/components/game/balance-hero";
import { BoostPurchaseCard } from "@/components/game/boost-purchase-card";
import { useGame } from "@/components/game/game-provider";
import {
  DAILY_MAX_STREAK,
  EVENT_SLOT_MS,
  formatDuration,
  formatInt,
  msUntilMidnight,
} from "@/lib/game";

export function BonusScreen() {
  return (
    <div className="flex flex-col gap-4 px-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-balance">Bonus</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Klaim hadiah token harian dan event terbatas waktu.
          </p>
        </div>
        <CompactBalance />
      </header>
      <ActiveBoostCard />
      <BoostPurchaseCard />
      <DailyCard />
      <EventCard />
    </div>
  );
}

function StatusPill({ claimed }: { claimed: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
        claimed
          ? "bg-secondary text-muted-foreground"
          : "bg-primary/15 text-primary"
      }`}
    >
      {claimed && <Check className="size-3.5" aria-hidden="true" />}
      {claimed ? "Sudah diklaim" : "Belum diklaim"}
    </span>
  );
}

function ActiveBoostCard() {
  const { state, multiplier, now } = useGame();
  if (multiplier <= 1 || !state.boost) return null;
  return (
    <section
      aria-label="Pengganda aktif"
      className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/10 p-4"
    >
      <Flame className="size-7 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-bold text-primary">{state.boost.label}</p>
        <p className="text-sm text-muted-foreground">
          Hasil tambang x{state.boost.mult} sedang aktif
        </p>
      </div>
      <p className="text-lg font-extrabold tabular-nums text-primary">
        {formatDuration(state.boost.until - now)}
      </p>
    </section>
  );
}

function DailyCard() {
  const { state, now, dailyAvailable, dailyStreakShown, dailyRewardValue, claimDaily } =
    useGame();
  const activeDay = Math.min(Math.max(dailyStreakShown, 1), DAILY_MAX_STREAK);

  return (
    <section
      aria-label="Bonus harian"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
            <CalendarCheck className="size-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Bonus Harian</h2>
            <p className="text-sm text-muted-foreground">
              Klaim sekali per hari
            </p>
          </div>
        </div>
        <StatusPill claimed={!dailyAvailable} />
      </div>

      <ol className="grid grid-cols-7 gap-1.5" aria-label="Rangkaian hari klaim">
        {Array.from({ length: DAILY_MAX_STREAK }, (_, index) => {
          const day = index + 1;
          const done = dailyAvailable ? day < activeDay : day <= activeDay;
          const current = dailyAvailable && day === activeDay;
          return (
            <li
              key={day}
              className={`flex h-10 items-center justify-center rounded-lg border text-sm font-bold tabular-nums ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : current
                    ? "border-accent text-accent"
                    : "border-border text-muted-foreground"
              }`}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : day}
              <span className="sr-only">
                {done ? `Hari ${day} selesai` : `Hari ${day}`}
              </span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        disabled={!dailyAvailable}
        onClick={claimDaily}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
      >
        <Gift className="size-5" aria-hidden="true" />
        {dailyAvailable
          ? `Klaim +${formatInt(dailyRewardValue)} CT`
          : `Bonus berikutnya dalam ${formatDuration(msUntilMidnight(now))}`}
      </button>
      {state.daily.streak > 0 && (
        <p className="-mt-2 text-center text-xs text-muted-foreground">
          Rangkaian saat ini: {state.daily.streak} hari. Klaim tiap hari agar hadiah makin besar.
        </p>
      )}
    </section>
  );
}

function EventCard() {
  const { event, eventAvailable, eventRewardLabel, claimEvent, now } = useGame();
  const remaining = event.endsAt - now;
  const progress = Math.min(1, Math.max(0, remaining / EVENT_SLOT_MS));

  return (
    <section
      aria-label="Event bonus"
      className="flex flex-col gap-4 rounded-2xl border border-accent/60 bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
            <Timer className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              Event bonus
            </p>
            <h2 className="truncate text-lg font-bold">{event.def.name}</h2>
          </div>
        </div>
        <StatusPill claimed={!eventAvailable} />
      </div>

      <p className="text-sm text-muted-foreground text-pretty">
        {event.def.description}
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Berakhir dalam</span>
          <span className="font-bold tabular-nums text-accent">
            {formatDuration(remaining)}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Sisa waktu event"
        >
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!eventAvailable}
        onClick={claimEvent}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
      >
        {eventAvailable
          ? `Klaim ${eventRewardLabel}`
          : `Sudah diklaim. Event baru dalam ${formatDuration(remaining)}`}
      </button>
    </section>
  );
}
