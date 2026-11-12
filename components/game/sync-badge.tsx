"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

export function SyncBadge() {
  const { saveStatus } = useGame();

  const config = {
    tersimpan: {
      label: "Progres tersimpan",
      Icon: Cloud,
      className: "text-muted-foreground",
      iconClass: "text-accent",
    },
    menyimpan: {
      label: "Menyimpan...",
      Icon: RefreshCw,
      className: "text-muted-foreground",
      iconClass: "text-accent animate-spin",
    },
    tertunda: {
      label: "Menunggu koneksi, mencoba lagi",
      Icon: CloudOff,
      className: "text-destructive",
      iconClass: "text-destructive",
    },
  }[saveStatus];

  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs font-medium ${config.className}`}
    >
      <config.Icon className={`size-3.5 ${config.iconClass}`} aria-hidden="true" />
      {config.label}
    </p>
  );
}
