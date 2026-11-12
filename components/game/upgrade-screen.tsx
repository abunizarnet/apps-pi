"use client";

import { Coins } from "lucide-react";
import { CompactBalance } from "@/components/game/balance-hero";
import { useGame } from "@/components/game/game-provider";
import { UpgradeIcon } from "@/components/game/upgrade-icon";
import {
  UPGRADES,
  formatInt,
  formatRate,
  upgradeCost,
  type UpgradeDef,
} from "@/lib/game";

export function UpgradeScreen() {
  const tapTools = UPGRADES.filter((def) => def.kind === "tap");
  const passiveTools = UPGRADES.filter((def) => def.kind === "passive");

  return (
    <div className="flex flex-col gap-5 px-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-balance">Upgrade Alat</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Hasil pasif berjalan selama kamu bermain di layar ini.
          </p>
        </div>
        <CompactBalance />
      </header>

      <UpgradeGroup title="Alat ketuk" tools={tapTools} />
      <UpgradeGroup title="Rig pasif" tools={passiveTools} />
    </div>
  );
}

function UpgradeGroup({ title, tools }: { title: string; tools: UpgradeDef[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {tools.map((def) => (
          <UpgradeCard key={def.id} def={def} />
        ))}
      </ul>
    </section>
  );
}

function UpgradeCard({ def }: { def: UpgradeDef }) {
  const { state, buyUpgrade } = useGame();
  const level = state.levels[def.id] ?? 0;
  const maxed = level >= def.maxLevel;
  const cost = upgradeCost(def, level);
  const affordable = state.balance >= cost;
  const unit = def.kind === "tap" ? "/ ketuk" : "/ detik";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <UpgradeIcon name={def.icon} className="size-7" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-bold">{def.name}</h3>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold tabular-nums text-accent">
              Lv {level}
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            {def.description}
          </p>
          <p className="text-sm font-semibold tabular-nums text-accent">
            +{formatRate(def.gain)} {unit} per level
            {level > 0 && (
              <span className="font-normal text-muted-foreground">
                {" "}
                (total +{formatRate(def.gain * level)})
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={maxed || !affordable}
        onClick={() => buyUpgrade(def.id)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
      >
        {maxed ? (
          "Level maksimum"
        ) : (
          <>
            <span>Naik ke Lv {level + 1}</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Coins className="size-4" aria-hidden="true" />
              {formatInt(cost)}
            </span>
            {!affordable && <span className="sr-only">, token belum cukup</span>}
          </>
        )}
      </button>
      {!maxed && !affordable && (
        <p className="-mt-1 text-center text-xs tabular-nums text-muted-foreground">
          Kurang {formatInt(cost - state.balance)} CT lagi
        </p>
      )}
    </li>
  );
}
