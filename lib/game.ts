export const SAVE_KEY = "ct-pool-save";
export const EVENT_SLOT_MS = 15 * 60 * 1000;

export type IconKey =
  | "pickaxe"
  | "hammer"
  | "wrench"
  | "cpu"
  | "server"
  | "zap"
  | "atom";

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  icon: IconKey;
  kind: "tap" | "passive";
  gain: number;
  baseCost: number;
  growth: number;
  maxLevel: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "beliung-perunggu",
    name: "Beliung Perunggu",
    description: "Beliung pertamamu. Tiap ketukan makin bertenaga.",
    icon: "pickaxe",
    kind: "tap",
    gain: 1,
    baseCost: 15,
    growth: 1.17,
    maxLevel: 60,
  },
  {
    id: "beliung-titanium",
    name: "Beliung Titanium",
    description: "Ringan, kuat, dan berkilau saat membelah blok.",
    icon: "hammer",
    kind: "tap",
    gain: 6,
    baseCost: 250,
    growth: 1.19,
    maxLevel: 60,
  },
  {
    id: "bor-neon",
    name: "Bor Neon",
    description: "Menembus lapisan hash dengan sinar cyan.",
    icon: "wrench",
    kind: "tap",
    gain: 40,
    baseCost: 4000,
    growth: 1.2,
    maxLevel: 60,
  },
  {
    id: "rig-gpu-mini",
    name: "Rig GPU Mini",
    description: "Menambang sendiri sambil kamu santai.",
    icon: "cpu",
    kind: "passive",
    gain: 0.5,
    baseCost: 40,
    growth: 1.15,
    maxLevel: 60,
  },
  {
    id: "rig-asic",
    name: "Rig ASIC",
    description: "Mesin khusus tambang, hasilnya stabil tiap detik.",
    icon: "server",
    kind: "passive",
    gain: 6,
    baseCost: 600,
    growth: 1.16,
    maxLevel: 60,
  },
  {
    id: "kluster-server",
    name: "Kluster Server",
    description: "Puluhan server menyala bersamaan di ruang pendingin.",
    icon: "zap",
    kind: "passive",
    gain: 45,
    baseCost: 7500,
    growth: 1.17,
    maxLevel: 60,
  },
  {
    id: "reaktor-kuantum",
    name: "Reaktor Kuantum",
    description: "Sumber energi tak terbatas untuk tambang raksasa.",
    icon: "atom",
    kind: "passive",
    gain: 350,
    baseCost: 90000,
    growth: 1.18,
    maxLevel: 60,
  },
];

export interface GameState {
  balance: number;
  totalMined: number;
  totalTaps: number;
  levels: Record<string, number>;
  startedAt: number;
  daily: { lastClaim: string | null; streak: number };
  eventClaims: Record<string, number>;
  boost: { mult: number; until: number; label: string } | null;
}

export function createInitialState(now: number): GameState {
  return {
    balance: 0,
    totalMined: 0,
    totalTaps: 0,
    levels: {},
    startedAt: now,
    daily: { lastClaim: null, streak: 0 },
    eventClaims: {},
    boost: null,
  };
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

export function serializeState(state: GameState): Record<string, unknown> {
  return {
    balance: Math.round(state.balance * 100) / 100,
    totalMined: Math.round(state.totalMined * 100) / 100,
    totalTaps: state.totalTaps,
    levels: state.levels,
    startedAt: state.startedAt,
    daily: state.daily,
    eventClaims: state.eventClaims,
    boost: state.boost,
  };
}

export function deserializeState(blob: Record<string, unknown>): GameState {
  const now = Date.now();
  const base = createInitialState(num(blob.startedAt, now) || now);

  const levels: Record<string, number> = {};
  const rawLevels =
    typeof blob.levels === "object" && blob.levels !== null
      ? (blob.levels as Record<string, unknown>)
      : {};
  for (const def of UPGRADES) {
    levels[def.id] = Math.min(Math.floor(num(rawLevels[def.id])), def.maxLevel);
  }

  const rawDaily =
    typeof blob.daily === "object" && blob.daily !== null
      ? (blob.daily as Record<string, unknown>)
      : {};
  const lastClaim =
    typeof rawDaily.lastClaim === "string" ? rawDaily.lastClaim : null;

  const eventClaims: Record<string, number> = {};
  if (typeof blob.eventClaims === "object" && blob.eventClaims !== null) {
    for (const [key, value] of Object.entries(
      blob.eventClaims as Record<string, unknown>,
    )) {
      eventClaims[key] = num(value);
    }
  }

  let boost: GameState["boost"] = null;
  if (typeof blob.boost === "object" && blob.boost !== null) {
    const raw = blob.boost as Record<string, unknown>;
    const until = num(raw.until);
    if (until > now) {
      boost = {
        mult: Math.max(1, num(raw.mult, 1)),
        until,
        label: typeof raw.label === "string" ? raw.label : "Bonus",
      };
    }
  }

  return {
    ...base,
    balance: num(blob.balance),
    totalMined: num(blob.totalMined),
    totalTaps: Math.floor(num(blob.totalTaps)),
    levels,
    daily: { lastClaim, streak: Math.floor(num(rawDaily.streak)) },
    eventClaims,
    boost,
  };
}

export function upgradeCost(def: UpgradeDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.growth, level));
}

export function tapValue(levels: Record<string, number>): number {
  return UPGRADES.reduce(
    (sum, def) =>
      def.kind === "tap" ? sum + (levels[def.id] ?? 0) * def.gain : sum,
    1,
  );
}

export function passiveRate(levels: Record<string, number>): number {
  return UPGRADES.reduce(
    (sum, def) =>
      def.kind === "passive" ? sum + (levels[def.id] ?? 0) * def.gain : sum,
    0,
  );
}

export function multiplierAt(boost: GameState["boost"], now: number): number {
  return boost && boost.until > now ? boost.mult : 1;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function yesterdayKey(now: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}

export function msUntilMidnight(now: number): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now;
}

export const DAILY_MAX_STREAK = 7;

export function dailyReward(streak: number, passive: number): number {
  const day = Math.min(Math.max(streak, 1), DAILY_MAX_STREAK);
  return day * (300 + Math.round(passive * 20));
}

export interface EventDef {
  id: string;
  name: string;
  description: string;
  kind: "tokens" | "boost";
  mult?: number;
  durationMs?: number;
}

export const EVENTS: EventDef[] = [
  {
    id: "hujan-token",
    name: "Hujan Token",
    description: "Token jatuh dari langit server. Ambil hadiah token ekstra sekarang.",
    kind: "tokens",
  },
  {
    id: "turbo-tambang",
    name: "Turbo Tambang x2",
    description: "Hasil tambang berlipat dua selama 2 menit penuh.",
    kind: "boost",
    mult: 2,
    durationMs: 120_000,
  },
  {
    id: "badai-kilau",
    name: "Badai Kilau x3",
    description: "Pengganda x3 untuk ketukan dan hasil pasif selama 45 detik.",
    kind: "boost",
    mult: 3,
    durationMs: 45_000,
  },
];

export interface ActiveEvent {
  def: EventDef;
  slot: number;
  endsAt: number;
}

export function currentEvent(now: number): ActiveEvent {
  const slot = Math.floor(now / EVENT_SLOT_MS);
  return {
    def: EVENTS[slot % EVENTS.length],
    slot,
    endsAt: (slot + 1) * EVENT_SLOT_MS,
  };
}

export function eventTokenReward(tap: number, passive: number): number {
  return Math.max(300, Math.round(passive * 120 + tap * 80));
}

export interface Rival {
  name: string;
  base: number;
  rate: number;
}

const RIVALS: Rival[] = [
  { name: "SatoshiBali", base: 120000, rate: 55 },
  { name: "NgetapNinja", base: 80000, rate: 42 },
  { name: "KangHash", base: 52000, rate: 30 },
  { name: "PakCoin", base: 34000, rate: 22 },
  { name: "MbakBlock", base: 21000, rate: 16 },
  { name: "DukunNode", base: 12500, rate: 11 },
  { name: "CuanSubuh", base: 7800, rate: 8 },
  { name: "TambangPagi", base: 4200, rate: 5.5 },
  { name: "SiKilau", base: 2100, rate: 3.2 },
  { name: "WargaToken", base: 900, rate: 1.8 },
  { name: "NewbieJkt", base: 350, rate: 0.9 },
  { name: "RajaGPU", base: 150, rate: 0.4 },
];

export interface LeaderboardEntry {
  name: string;
  total: number;
  isPlayer: boolean;
  rank: number;
}

export function buildLeaderboard(
  playerName: string,
  playerTotal: number,
  startedAt: number,
  now: number,
): LeaderboardEntry[] {
  const elapsed = Math.max(0, now - startedAt) / 1000;
  const rows = [
    ...RIVALS.map((rival) => ({
      name: rival.name,
      total: rival.base + rival.rate * elapsed,
      isPlayer: false,
    })),
    { name: playerName, total: playerTotal, isPlayer: true },
  ];
  rows.sort((a, b) => b.total - a.total);
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

const integerFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});
const decimalFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

export function formatInt(value: number): string {
  return integerFormat.format(Math.floor(value));
}

export function formatCompact(value: number): string {
  if (value < 10_000) return formatInt(value);
  const units: [number, string][] = [
    [1e12, " T"],
    [1e9, " M"],
    [1e6, " jt"],
    [1e3, " rb"],
  ];
  for (const [size, suffix] of units) {
    if (value >= size) return `${decimalFormat.format(value / size)}${suffix}`;
  }
  return formatInt(value);
}

export function formatRate(value: number): string {
  if (value < 100) return decimalFormat.format(value);
  return formatCompact(value);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
