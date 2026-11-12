"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { BonusScreen } from "@/components/game/bonus-screen";
import { BottomNav, type TabId } from "@/components/game/bottom-nav";
import { useGame } from "@/components/game/game-provider";
import { LeaderboardScreen } from "@/components/game/leaderboard-screen";
import { MineScreen } from "@/components/game/mine-screen";
import { NoticeToast } from "@/components/game/notice-toast";
import { SyncBadge } from "@/components/game/sync-badge";
import { UpgradeScreen } from "@/components/game/upgrade-screen";

export function GameShell() {
  const { ready, loadError, retryLoad, username } = useGame();
  const [tab, setTab] = useState<TabId>("tambang");

  useEffect(() => {
    document.title = "Made with App Studio";
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-none tracking-wide text-primary">
            CT POOL
          </p>
          <p className="truncate text-xs text-muted-foreground">{username}</p>
        </div>
        {ready && <SyncBadge />}
      </header>

      <main className="flex-1 pb-28">
        {!ready ? (
          <LoadingState error={loadError} onRetry={retryLoad} />
        ) : (
          <>
            {tab === "tambang" && <MineScreen onNavigate={setTab} />}
            {tab === "upgrade" && <UpgradeScreen />}
            {tab === "bonus" && <BonusScreen />}
            {tab === "peringkat" && <LeaderboardScreen />}
          </>
        )}
      </main>

      {ready && <BottomNav active={tab} onChange={setTab} />}
      <NoticeToast />
    </div>
  );
}

function LoadingState({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <p className="text-lg font-bold">Progres belum bisa dimuat</p>
        <p className="text-sm text-muted-foreground text-pretty">
          Periksa koneksimu lalu coba lagi. Progresmu aman di akun Pi.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  }
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-6 py-24 text-center">
      <Loader2 className="size-8 animate-spin text-accent" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Memuat progres tambangmu...</p>
    </div>
  );
}
