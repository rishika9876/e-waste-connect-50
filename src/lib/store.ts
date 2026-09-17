import { useMemo, useRef, useSyncExternalStore } from "react";
import { buildSeed, CATEGORIES, pad } from "./seed";
import type { DB, Lot, Session, SyncState } from "./types";
import type { Lang } from "./i18n";

const KEY = "ewaste_setu_db_v1";
let cache: DB | null = null;
const listeners = new Set<() => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Keep data saved by older demo versions compatible with the current UI. */
function normalizeStoredDB(value: unknown): DB {
  const seed = buildSeed();
  if (!isRecord(value)) return seed;

  const arrayOrSeed = <T,>(key: keyof DB, fallback: T[]): T[] =>
    Array.isArray(value[key]) ? (value[key] as T[]) : fallback;
  const storedSettings = isRecord(value["settings"]) ? value["settings"] : {};
  const storedSession = isRecord(value["session"]) ? value["session"] : null;
  const session: Session | null =
    storedSession &&
    (storedSession["role"] === "collector" ||
      storedSession["role"] === "recycler" ||
      storedSession["role"] === "admin") &&
    typeof storedSession["id"] === "string" &&
    typeof storedSession["name"] === "string"
      ? { role: storedSession["role"], id: storedSession["id"], name: storedSession["name"] }
      : null;

  return {
    collectors: arrayOrSeed("collectors", seed.collectors),
    recyclers: arrayOrSeed("recyclers", seed.recyclers).map((recycler) => ({
      ...recycler,
      materials_accepted: Array.isArray(recycler.materials_accepted)
        ? recycler.materials_accepted
        : [],
      offered_rate: isRecord(recycler.offered_rate) ? recycler.offered_rate : {},
      service_area: Array.isArray(recycler.service_area) ? recycler.service_area : [],
    })),
    materials: arrayOrSeed("materials", seed.materials),
    prices: arrayOrSeed("prices", seed.prices),
    lots: arrayOrSeed("lots", seed.lots).map((lot) => ({
      ...lot,
      items: Array.isArray(lot.items) ? lot.items : [],
      timeline: Array.isArray(lot.timeline) ? lot.timeline : [],
      sync: lot.sync === "pending" || lot.sync === "failed" ? lot.sync : "synced",
    })),
    transactions: arrayOrSeed("transactions", seed.transactions),
    traceability: arrayOrSeed("traceability", seed.traceability),
    notifications: arrayOrSeed("notifications", seed.notifications),
    settings: {
      commission_pct:
        typeof storedSettings["commission_pct"] === "number"
          ? storedSettings["commission_pct"]
          : seed.settings.commission_pct,
      pickup_cost:
        typeof storedSettings["pickup_cost"] === "number"
          ? storedSettings["pickup_cost"]
          : seed.settings.pickup_cost,
      ops_cost:
        typeof storedSettings["ops_cost"] === "number"
          ? storedSettings["ops_cost"]
          : seed.settings.ops_cost,
    },
    session,
    lang:
      value["lang"] === "en" || value["lang"] === "hi" || value["lang"] === "mr"
        ? value["lang"]
        : seed.lang,
    queue: arrayOrSeed("queue", seed.queue),
  };
}

function load(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = buildSeed());
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? normalizeStoredDB(JSON.parse(raw) as unknown) : buildSeed();
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    cache = buildSeed();
  }
  return cache;
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full / private mode: keep working in memory */
  }
}

export function getDB(): DB {
  return load();
}

let version = 0;

function bump() {
  version += 1;
  listeners.forEach((l) => l());
}

export function setDB(fn: (db: DB) => DB | void) {
  const db = load();
  const next = fn(db);
  cache = (next as DB) ?? db;
  persist();
  bump();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = buildSeed();

/**
 * Selector-based store hook. The external snapshot is a stable version number,
 * so selectors may return freshly-created objects/arrays without tripping
 * React's "getSnapshot should be cached" infinite-loop guard.
 */
export function useDB<T>(select: (db: DB) => T): T {
  const selectRef = useRef(select);
  selectRef.current = select;
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => -1,
  );
  return useMemo(
    () => (v === -1 ? selectRef.current(serverSnapshot) : selectRef.current(load())),
    [v],
  );
}

export function resetDemoData() {
  cache = buildSeed();
  persist();
  bump();
}

/* ---------- session & language ---------- */

export function useSession() {
  return useDB((d) => d.session);
}

export function signIn(session: Session) {
  setDB((d) => {
    d.session = session;
  });
}

export function signOut() {
  setDB((d) => {
    d.session = null;
  });
}

export function useLang(): Lang {
  return useDB((d) => d.lang) as Lang;
}

export function setLang(lang: Lang) {
  setDB((d) => {
    d.lang = lang;
    if (d.session?.role === "collector") {
      const collectorId = d.session.id;
      const c = d.collectors.find((x) => x.collector_id === collectorId);
      if (c) c.preferred_language = lang;
    }
  });
}

/* ---------- ids ---------- */

export function nextLotId(db: DB) {
  return `EW-2026-${pad(100 + db.lots.length + 1)}`;
}
export function nextTxnId(db: DB) {
  return `TXN-2026-${pad(db.transactions.length + 1, 5)}`;
}
export function nextHandoverId(db: DB) {
  return `HO-EW-2026-${pad(50 + db.traceability.length + 1, 5)}`;
}

/* ---------- sync queue (offline-first) ---------- */

export function enqueue(label: string) {
  const id = `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  setDB((d) => {
    d.queue.unshift({
      id,
      label,
      at: new Date().toISOString(),
      state: online ? "pending" : "pending",
    });
  });
  if (online) window.setTimeout(() => flushQueue(), 1200);
  return id;
}

export function flushQueue() {
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  if (!online) return;
  setDB((d) => {
    d.queue = d.queue.map((q) => (q.state === "pending" ? { ...q, state: "synced" as SyncState } : q));
    d.lots = d.lots.map((l) => (l.sync === "pending" ? { ...l, sync: "synced" as SyncState } : l));
  });
}

export function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/* ---------- domain helpers ---------- */

export function priceFor(db: DB, category: string, location?: string) {
  const rows = db.prices
    .filter((p) => p.material_category === category)
    .filter((p) => (location ? p.location === location : true))
    .sort((a, b) => +new Date(b.date_time) - +new Date(a.date_time));
  const fallback = CATEGORIES.find((c) => c.key === category);
  if (!rows.length) {
    return {
      current: fallback ? Math.round((fallback.min + fallback.max) / 2) : 0,
      min: fallback?.min ?? 0,
      max: fallback?.max ?? 0,
      avg: fallback ? Math.round((fallback.min + fallback.max) / 2) : 0,
      highest: fallback?.max ?? 0,
      history: [] as { date: string; value: number }[],
      trend: "stable" as const,
    };
  }
  const current = rows[0]!.buying_price;
  const values = rows.map((r) => r.buying_price);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const history = [...rows]
    .reverse()
    .map((r) => ({ date: r.date_time.slice(5, 10), value: r.buying_price }));
  const prev = rows[1]?.buying_price ?? current;
  const trend = current > prev * 1.02 ? "up" : current < prev * 0.98 ? "down" : "stable";
  return {
    current,
    min: rows[0]!.market_range_min,
    max: rows[0]!.market_range_max,
    avg,
    highest: Math.max(...values),
    history,
    trend: trend as "up" | "down" | "stable",
  };
}

export function recommendRecyclers(db: DB, category?: string, location?: string) {
  return db.recyclers
    .filter((r) => r.authorization_status === "verified")
    .filter((r) => (category ? r.materials_accepted.includes(category) : true))
    .filter((r) => (location ? r.service_area.includes(location) || true : true))
    .map((r) => {
      const rate = category ? (r.offered_rate[category] ?? 0) : 0;
      const score =
        rate * 1.4 - r.distance_km * 3 + (r.pickup_available ? 25 : 0) + r.rating * 12;
      return { ...r, rate, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function collectorStats(db: DB, collectorId: string) {
  const txns = db.transactions.filter((t) => t.collector_id === collectorId);
  const completed = txns
    .filter((t) => t.payment_status === "cash_paid" || t.payment_status === "upi_paid")
    .reduce((a, t) => a + t.final_price, 0);
  const pending = txns
    .filter((t) => t.payment_status === "pending" || t.payment_status === "partially_paid")
    .reduce((a, t) => a + t.final_price, 0);
  const lots = db.lots.filter((l) => l.collector_id === collectorId);
  return {
    completed,
    pending,
    total: completed + pending,
    lotsSold: lots.filter((l) => l.status === "paid").length,
    txnCount: txns.length,
    lots,
    txns,
  };
}

export function advanceLot(lotId: string, status: Lot["status"], step: string, icon: string) {
  setDB((d) => {
    const lot = d.lots.find((l) => l.lot_id === lotId);
    if (!lot) return;
    lot.status = status;
    lot.timeline.push({
      step,
      icon,
      at: new Date().toISOString(),
      location: lot.collection_location,
    });
  });
}
