"use client";

import { ArrowUpCircle, Gift, Pickaxe, Trophy, type LucideIcon } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

export type TabId = "tambang" | "upgrade" | "bonus" | "peringkat";

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: "tambang", label: "Tambang", Icon: Pickaxe },
  { id: "upgrade", label: "Upgrade", Icon: ArrowUpCircle },
  { id: "bonus", label: "Bonus", Icon: Gift },
  { id: "peringkat", label: "Peringkat", Icon: Trophy },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  const { dailyAvailable, eventAvailable } = useGame();
  const bonusReady = dailyAvailable || eventAvailable;

  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
                {id === "bonus" && bonusReady && (
                  <>
                    <span
                      className="absolute right-[28%] top-1.5 size-2.5 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span className="sr-only">, ada bonus yang bisa diklaim</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
