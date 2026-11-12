"use client";

import { Gift, Info, TriangleAlert } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

const TONES = {
  success: { Icon: Gift, className: "border-primary text-primary" },
  info: { Icon: Info, className: "border-accent text-accent" },
  warn: { Icon: TriangleAlert, className: "border-destructive text-destructive" },
} as const;

export function NoticeToast() {
  const { notice, dismissNotice } = useGame();
  if (!notice) return null;
  const { Icon, className } = TONES[notice.tone];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <button
        key={notice.id}
        type="button"
        onClick={dismissNotice}
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full max-w-md animate-in items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left text-sm font-medium shadow-lg fade-in slide-in-from-top-4 ${className}`}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="text-pretty text-card-foreground">{notice.text}</span>
      </button>
    </div>
  );
}
