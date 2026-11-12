"use client";

import { ArrowUpCircle, Gift, Trophy } from "lucide-react";
import { BalanceHero } from "@/components/game/balance-hero";
import type { TabId } from "@/components/game/bottom-nav";
import { useGame } from "@/components/game/game-provider";
import { TapArea } from "@/components/game/tap-area";
import { UpgradeIcon } from "@/components/game/upgrade-icon";
import { UPGRADES, formatInt, upgradeCost } from "@/lib/game";

export function MineScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, dailyAvailable, eventAvailable } = useGame();

  const candidates = UPGRADES.filter(
    (def) => (state.levels[def.id] ?? 0) < def.maxLevel,
  ).map((def) => ({
    def,
    cost: upgradeCost(def, state.levels[def.id] ?? 0),
  }));
  const next = candidates.sort((a, b) => a.cost - b.cost)[0];
  const progress = next ? Math.min(1, state.balance / next.cost) : 1;
  const canBuy = next ? state.balance >= next.cost : false;
  const bonusReady = dailyAvailable || eventAvailable;

  return (
    <div className="flex flex-col gap-2">
      <BalanceHero />
      <TapArea />

      <div className="flex flex-col gap-3 px-4">
        {next && (
          <button
            type="button"
            onClick={() => onNavigate("upgrade")}
            className={`flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
              canBuy ? "border-primary" : "border-border"
            }`}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent">
              <UpgradeIcon name={next.def.icon} className="size-6" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {canBuy ? "Siap di-upgrade: " : "Berikutnya: "}
                  {next.def.name}
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {formatInt(next.cost)} CT
                </span>
              </span>
              <span
                className="h-2 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-label="Progres menuju upgrade berikutnya"
              >
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            </span>
          </button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <QuickButton
            icon={<ArrowUpCircle className="size-5" aria-hidden="true" />}
            label="Upgrade"
            highlight={canBuy}
            onClick={() => onNavigate("upgrade")}
          />
          <QuickButton
            icon={<Gift className="size-5" aria-hidden="true" />}
            label={bonusReady ? "Bonus siap!" : "Bonus"}
            highlight={bonusReady}
            onClick={() => onNavigate("bonus")}
          />
          <QuickButton
            icon={<Trophy className="size-5" aria-hidden="true" />}
            label="Peringkat"
            onClick={() => onNavigate("peringkat")}
          />
        </div>
      </div>
    </div>
  );
}

function QuickButton({
  icon,
  label,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
        highlight
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
