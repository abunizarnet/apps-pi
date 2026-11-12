import {
  Atom,
  Cpu,
  Hammer,
  Pickaxe,
  Server,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/game";

const ICONS: Record<IconKey, LucideIcon> = {
  pickaxe: Pickaxe,
  hammer: Hammer,
  wrench: Wrench,
  cpu: Cpu,
  server: Server,
  zap: Zap,
  atom: Atom,
};

export function UpgradeIcon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}
