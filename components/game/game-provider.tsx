"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { pi } from "@/lib/pi";
import {
  SAVE_KEY,
  UPGRADES,
  createInitialState,
  currentEvent,
  dailyReward,
  dateKey,
  deserializeState,
  eventTokenReward,
  formatInt,
  multiplierAt,
  passiveRate,
  serializeState,
  tapValue,
  upgradeCost,
  yesterdayKey,
  DAILY_MAX_STREAK,
  type ActiveEvent,
  type GameState,
} from "@/lib/game";

export type SaveStatus = "tersimpan" | "menyimpan" | "tertunda";

export interface Notice {
  id: number;
  text: string;
  tone: "success" | "info" | "warn";
}

interface GameContextValue {
  ready: boolean;
  loadError: boolean;
  retryLoad: () => void;
  state: GameState;
  now: number;
  username: string;
  perTap: number;
  perSecond: number;
  multiplier: number;
  saveStatus: SaveStatus;
  tap: () => number;
  buyUpgrade: (id: string) => boolean;
  claimDaily: () => void;
  claimEvent: () => void;
  activatePurchasedBoost: () => void;
  notify: (text: string, tone: Notice["tone"]) => void;
  dailyAvailable: boolean;
  dailyStreakShown: number;
  dailyRewardValue: number;
  event: ActiveEvent;
  eventAvailable: boolean;
  eventRewardLabel: string;
  notice: Notice | null;
  dismissNotice: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const SAVE_INTERVAL_MS = 6000;
const MAX_BACKOFF_MS = 60_000;
const TICK_MS = 100;
const PURCHASED_BOOST_MULT = 2;
const PURCHASED_BOOST_MS = 10 * 60 * 1000;

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = usePiAuth();
  const username = user?.username ?? "Penambang";

  const [state, setState] = useState<GameState>(() =>
    createInitialState(Date.now()),
  );
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("tersimpan");
  const [notice, setNotice] = useState<Notice | null>(null);

  const stateRef = useRef(state);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const failuresRef = useRef(0);
  const lastAttemptRef = useRef(0);
  const nextAttemptRef = useRef(0);
  const noticeIdRef = useRef(0);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(
    (update: (current: GameState) => GameState) => {
      const next = update(stateRef.current);
      if (next === stateRef.current) return;
      stateRef.current = next;
      dirtyRef.current = true;
      setState(next);
    },
    [],
  );

  const pushNotice = useCallback((text: string, tone: Notice["tone"]) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, text, tone });
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 3800);
  }, []);

  const dismissNotice = useCallback(() => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setNotice(null);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    },
    [],
  );

  const loadSave = useCallback(async () => {
    setLoadError(false);
    try {
      const record = await pi.userState.get(SAVE_KEY);
      const loaded = record
        ? deserializeState(record.blob)
        : createInitialState(Date.now());
      stateRef.current = loaded;
      dirtyRef.current = !record;
      setState(loaded);
      setReady(true);
    } catch (error) {
      console.error("[CT POOL] Gagal memuat progres:", error);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  useEffect(() => {
    if (!ready) return;
    let last = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      const dt = Math.min((t - last) / 1000, 1);
      last = t;
      setNow(t);
      commit((current) => {
        const expired = current.boost !== null && current.boost.until <= t;
        const rate = passiveRate(current.levels);
        if (!expired && rate <= 0) return current;
        const gain = rate * multiplierAt(current.boost, t) * dt;
        return {
          ...current,
          balance: current.balance + gain,
          totalMined: current.totalMined + gain,
          boost: expired ? null : current.boost,
        };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ready, commit]);

  const flushSave = useCallback(async (force: boolean) => {
    if (savingRef.current || !dirtyRef.current) return;
    const t = Date.now();
    if (!force) {
      if (t < nextAttemptRef.current) return;
      if (t - lastAttemptRef.current < SAVE_INTERVAL_MS) return;
    }
    savingRef.current = true;
    lastAttemptRef.current = t;
    dirtyRef.current = false;
    setSaveStatus("menyimpan");
    try {
      await pi.userState.set(SAVE_KEY, serializeState(stateRef.current));
      failuresRef.current = 0;
      nextAttemptRef.current = 0;
      setSaveStatus("tersimpan");
    } catch (error) {
      console.error("[CT POOL] Gagal menyimpan progres:", error);
      dirtyRef.current = true;
      failuresRef.current += 1;
      nextAttemptRef.current =
        Date.now() +
        Math.min(MAX_BACKOFF_MS, SAVE_INTERVAL_MS * 2 ** failuresRef.current);
      setSaveStatus("tertunda");
    } finally {
      savingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => flushSave(false), 1000);
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushSave(true);
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onHidden);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onHidden);
    };
  }, [ready, flushSave]);

  const failuresNoticeRef = useRef(0);
  useEffect(() => {
    if (saveStatus === "tertunda" && failuresNoticeRef.current === 0) {
      failuresNoticeRef.current = 1;
      pushNotice(
        "Koneksi sedang bermasalah. Progresmu akan disimpan ulang otomatis.",
        "warn",
      );
    }
    if (saveStatus === "tersimpan") failuresNoticeRef.current = 0;
  }, [saveStatus, pushNotice]);

  const perTap = tapValue(state.levels);
  const perSecond = passiveRate(state.levels);
  const multiplier = multiplierAt(state.boost, now);

  const today = dateKey(new Date(now));
  const dailyAvailable = state.daily.lastClaim !== today;
  const nextStreak =
    state.daily.lastClaim === yesterdayKey(now) ? state.daily.streak + 1 : 1;
  const dailyStreakShown = dailyAvailable ? nextStreak : state.daily.streak;
  const dailyRewardValue = dailyReward(dailyStreakShown, perSecond);

  const event = useMemo(() => currentEvent(now), [now]);
  const eventAvailable = state.eventClaims[event.def.id] !== event.slot;
  const eventRewardLabel =
    event.def.kind === "tokens"
      ? `+${formatInt(eventTokenReward(perTap, perSecond))} CT`
      : `x${event.def.mult} selama ${Math.round((event.def.durationMs ?? 0) / 1000)} detik`;

  const tap = useCallback(() => {
    const gain =
      tapValue(stateRef.current.levels) *
      multiplierAt(stateRef.current.boost, Date.now());
    commit((current) => ({
      ...current,
      balance: current.balance + gain,
      totalMined: current.totalMined + gain,
      totalTaps: current.totalTaps + 1,
    }));
    return gain;
  }, [commit]);

  const buyUpgrade = useCallback(
    (id: string) => {
      const def = UPGRADES.find((item) => item.id === id);
      if (!def) return false;
      const level = stateRef.current.levels[id] ?? 0;
      if (level >= def.maxLevel) return false;
      const cost = upgradeCost(def, level);
      if (stateRef.current.balance < cost) return false;
      commit((current) => ({
        ...current,
        balance: current.balance - cost,
        levels: { ...current.levels, [id]: level + 1 },
      }));
      return true;
    },
    [commit],
  );

  const claimDaily = useCallback(() => {
    const t = Date.now();
    const current = stateRef.current;
    if (current.daily.lastClaim === dateKey(new Date(t))) {
      pushNotice("Bonus harian sudah diklaim. Kembali lagi besok!", "info");
      return;
    }
    const streak =
      current.daily.lastClaim === yesterdayKey(t) ? current.daily.streak + 1 : 1;
    const reward = dailyReward(streak, passiveRate(current.levels));
    commit((s) => ({
      ...s,
      balance: s.balance + reward,
      daily: { lastClaim: dateKey(new Date(t)), streak },
    }));
    pushNotice(
      `Klaim berhasil! +${formatInt(reward)} CT (hari ke-${Math.min(streak, DAILY_MAX_STREAK)})`,
      "success",
    );
  }, [commit, pushNotice]);

  const claimEvent = useCallback(() => {
    const t = Date.now();
    const active = currentEvent(t);
    const current = stateRef.current;
    if (current.eventClaims[active.def.id] === active.slot) {
      pushNotice("Bonus event ini sudah kamu klaim.", "info");
      return;
    }
    if (active.def.kind === "tokens") {
      const reward = eventTokenReward(
        tapValue(current.levels),
        passiveRate(current.levels),
      );
      commit((s) => ({
        ...s,
        balance: s.balance + reward,
        eventClaims: { ...s.eventClaims, [active.def.id]: active.slot },
      }));
      pushNotice(`Klaim berhasil! +${formatInt(reward)} CT dari ${active.def.name}`, "success");
      return;
    }
    const mult = active.def.mult ?? 1;
    const duration = active.def.durationMs ?? 0;
    commit((s) => ({
      ...s,
      eventClaims: { ...s.eventClaims, [active.def.id]: active.slot },
      boost: { mult, until: t + duration, label: active.def.name },
    }));
    pushNotice(`${active.def.name} aktif! Hasil tambangmu berlipat.`, "success");
  }, [commit, pushNotice]);

  const activatePurchasedBoost = useCallback(() => {
    const t = Date.now();
    commit((s) => ({
      ...s,
      boost: {
        mult: PURCHASED_BOOST_MULT,
        until: Math.max(s.boost?.until ?? 0, t) + PURCHASED_BOOST_MS,
        label: "Boost Pi",
      },
    }));
    pushNotice("Boost aktif! Hasil tambangmu berlipat.", "success");
  }, [commit, pushNotice]);

  const prevSlotRef = useRef<{ slot: number; claimed: boolean } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const previous = prevSlotRef.current;
    if (!previous) {
      if (dailyAvailable) {
        pushNotice("Bonus harian siap diklaim!", "info");
      } else if (eventAvailable) {
        pushNotice(`Event bonus tersedia: ${event.def.name}`, "info");
      }
    } else if (previous.slot !== event.slot) {
      pushNotice(
        previous.claimed
          ? `Event bonus baru tersedia: ${event.def.name}`
          : `Event sebelumnya berakhir. Event baru: ${event.def.name}`,
        "info",
      );
    }
    prevSlotRef.current = { slot: event.slot, claimed: !eventAvailable };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, event.slot]);

  useEffect(() => {
    if (prevSlotRef.current && prevSlotRef.current.slot === event.slot) {
      prevSlotRef.current.claimed = !eventAvailable;
    }
  }, [eventAvailable, event.slot]);

  const value: GameContextValue = {
    ready,
    loadError,
    retryLoad: loadSave,
    state,
    now,
    username,
    perTap,
    perSecond,
    multiplier,
    saveStatus,
    tap,
    buyUpgrade,
    claimDaily,
    claimEvent,
    activatePurchasedBoost,
    notify: pushNotice,
    dailyAvailable,
    dailyStreakShown,
    dailyRewardValue,
    event,
    eventAvailable,
    eventRewardLabel,
    notice,
    dismissNotice,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame harus dipakai di dalam GameProvider");
  }
  return context;
}
