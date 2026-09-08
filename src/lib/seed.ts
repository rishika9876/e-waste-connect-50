import type {
  Collector,
  DB,
  Lot,
  Material,
  Price,
  Recycler,
  Traceability,
  Transaction,
} from "./types";

export const LOCATIONS = ["Sangli", "Pune", "Kolhapur", "Mumbai", "Dhule"];

export const CATEGORIES = [
  { key: "PCB", label: "Printed Circuit Board", icon: "🧩", min: 160, max: 220 },
  { key: "Copper Cable", label: "Copper Wire / Cable", icon: "🔌", min: 450, max: 600 },
  { key: "Aluminium", label: "Aluminium Body / Frame", icon: "🪙", min: 120, max: 180 },
  { key: "Battery", label: "Li-ion / Lead Battery", icon: "🔋", min: 80, max: 120 },
  { key: "LCD Panel", label: "LCD / LED Display", icon: "🖥️", min: 40, max: 70 },
  { key: "CRT", label: "CRT Monitor / TV", icon: "📺", min: 12, max: 25 },
  { key: "Motor", label: "Motor / Magnet Assembly", icon: "⚙️", min: 90, max: 140 },
  { key: "Mixed Plastic", label: "Mixed Plastics", icon: "🧴", min: 15, max: 30 },
  { key: "Laptop", label: "Laptop / Notebook", icon: "💻", min: 210, max: 320 },
  { key: "Mobile Phone", label: "Mobile Handset", icon: "📱", min: 260, max: 420 },
  { key: "Charger", label: "Charger / Adapter", icon: "🔌", min: 90, max: 150 },
  { key: "Headphones", label: "Headphones / Earphones", icon: "🎧", min: 60, max: 110 },
];

const iso = (daysAgo: number, h = 10) =>
  new Date(Date.now() - daysAgo * 86400000 + h * 3600000).toISOString();

const rnd = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const pad = (n: number, len = 6) => String(n).padStart(len, "0");

function makeMaterials(): Material[] {
  return CATEGORIES.map((c, i) => ({
    material_id: `MAT-${pad(i + 1, 3)}`,
    category: c.key,
    subcategory: c.label,
    description: `${c.label} recovered from end-of-life electronics.`,
    icon: c.icon,
    approximate_weight: Math.round((1 + rnd(i + 1) * 5) * 10) / 10,
    condition: i % 3 === 0 ? "Used" : i % 3 === 1 ? "Damaged" : "Scrap",
    source_type: i % 2 === 0 ? "Household" : "Commercial",
    estimated_value: Math.round((c.min + c.max) / 2),
    created_at: iso(90),
    updated_at: iso(2),
  }));
}

const RECYCLER_SEED = [
  ["ABC E-Waste Recycling", "ABC Green Facility", "Sangli", 16.86, 74.57, "verified", 4.6, 8.5],
  ["Sahyadri Recyclers", "Sahyadri Unit 2", "Kolhapur", 16.7, 74.24, "verified", 4.4, 12.2],
  ["Green Loop Pvt Ltd", "Green Loop Plant", "Pune", 18.52, 73.85, "verified", 4.8, 21.0],
  ["Urja Metals", "Urja Recovery Center", "Sangli", 16.85, 74.6, "verified", 4.1, 5.2],
  ["Mumbai EcoCycle", "EcoCycle Andheri", "Mumbai", 19.11, 72.86, "verified", 4.5, 34.5],
  ["Dhule Scrap Solutions", "DSS Facility", "Dhule", 20.9, 74.77, "pending", 3.9, 18.6],
  ["Nirmal E-Recovery", "Nirmal Yard", "Pune", 18.6, 73.78, "pending", 4.0, 24.3],
  ["Shree Metal Traders", "Shree Yard", "Kolhapur", 16.72, 74.3, "rejected", 3.4, 14.0],
] as const;

function makeRecyclers(): Recycler[] {
  return RECYCLER_SEED.map((r, i) => {
    const rates: Record<string, number> = {};
    CATEGORIES.forEach((c, j) => {
      rates[c.key] = Math.round(c.min + (c.max - c.min) * (0.35 + rnd(i * 13 + j) * 0.6));
    });
    return {
      recycler_id: `REC-${pad(i + 1, 3)}`,
      recycler_name: r[0],
      facility_name: r[1],
      location: r[2],
      latitude: r[3],
      longitude: r[4],
      materials_accepted: CATEGORIES.filter((_, j) => (i + j) % 4 !== 0).map((c) => c.key),
      authorization_number: `MPCB/EW/2024/${1000 + i * 37}`,
      authorization_status: r[5] as Recycler["authorization_status"],
      contact: `+91 98${pad(220000 + i * 4321, 8)}`.slice(0, 17),
      offered_rate: rates,
      pickup_available: i % 3 !== 2,
      service_area: [r[2], LOCATIONS[(i + 1) % LOCATIONS.length]!],
      rating: r[6],
      distance_km: r[7],
      verification_date: r[5] === "verified" ? iso(60 + i) : undefined,
      created_at: iso(120 + i),
    };
  });
}

function makePrices(recyclers: Recycler[]): Price[] {
  const out: Price[] = [];
  let n = 1;
  CATEGORIES.forEach((c, ci) => {
    LOCATIONS.forEach((loc, li) => {
      for (let d = 0; d < 4; d++) {
        const drift = (rnd(ci * 7 + li * 3 + d) - 0.45) * (c.max - c.min) * 0.5;
        const base = Math.round((c.min + c.max) / 2 + drift);
        out.push({
          price_id: `PR-${pad(n++, 5)}`,
          material_category: c.key,
          subcategory: c.label,
          location: loc,
          date_time: iso(d * 9 + li),
          buying_price: base,
          selling_price: Math.round(base * 1.12),
          unit: "kg",
          market_range_min: c.min,
          market_range_max: c.max,
          recycler_id: recyclers[(ci + li + d) % recyclers.length]!.recycler_id,
          created_at: iso(d * 9 + li),
        });
      }
    });
  });
  return out;
}

function makeCollectors(): Collector[] {
  const names = [
    "Ramesh",
    "Sunita",
    "Imran",
    "Vikas",
    "Anita",
    "Sagar",
    "Pooja",
    "Kiran",
    "Dattatray",
    "Farida",
  ];
  return names.map((nm, i) => ({
    collector_id: `COL-${pad(i + 1, 4)}`,
    nickname: nm,
    mobile: `+9198${pad(760000 + i * 1111, 8)}`.slice(0, 16),
    preferred_language: (i % 3 === 0 ? "mr" : i % 3 === 1 ? "hi" : "en") as Collector["preferred_language"],
    general_location: LOCATIONS[i % LOCATIONS.length]!,
    created_at: iso(100 - i * 3),
  }));
}

const STEPS = [
  ["Material Collected", "📦"],
  ["Photo Captured", "📷"],
  ["Weight Recorded", "⚖️"],
  ["Price Estimated", "💰"],
  ["Recycler Selected", "🚚"],
  ["Pickup", "📍"],
  ["Handover", "🤝"],
  ["Recycler Confirmed", "✅"],
  ["Payment", "💵"],
  ["Recycling", "♻️"],
];

export function timelineFor(status: Lot["status"], loc: string, base: number) {
  const count =
    status === "available"
      ? 4
      : status === "pickup_requested"
        ? 5
        : status === "accepted" || status === "scheduled"
          ? 6
          : status === "collected"
            ? 7
            : status === "handover_confirmed"
              ? 8
              : 10;
  return STEPS.slice(0, count).map(([step, icon], i) => ({
    step: step!,
    icon: icon!,
    at: iso(base - i * 0.2, 9 + i),
    location: loc,
  }));
}

function makeLots(collectors: Collector[], recyclers: Recycler[]): Lot[] {
  const statuses: Lot["status"][] = [
    "available",
    "available",
    "pickup_requested",
    "accepted",
    "scheduled",
    "collected",
    "handover_confirmed",
    "paid",
    "paid",
    "paid",
    "paid",
    "paid",
    "available",
    "paid",
    "pickup_requested",
  ];
  return statuses.map((status, i) => {
    const cat = CATEGORIES[i % CATEGORIES.length]!;
    const col = collectors[i % collectors.length]!;
    const weight = Math.round((1 + rnd(i + 5) * 8) * 10) / 10;
    const est = Math.round(weight * ((cat.min + cat.max) / 2));
    const rec = recyclers[i % 5]!;
    const sold = status === "paid" || status === "handover_confirmed";
    return {
      lot_id: `EW-2026-${pad(100 + i)}`,
      collector_id: col.collector_id,
      items: [
        {
          material_category: cat.key,
          subcategory: cat.label,
          weight,
          condition: "Used",
        },
      ],
      description: `${cat.label} collected in ${col.general_location}`,
      weight,
      source_type: i % 2 ? "Household" : "Commercial",
      collection_location: col.general_location,
      gps: { lat: 16.85 + rnd(i) * 0.1, lng: 74.57 + rnd(i + 2) * 0.1 },
      created_at: iso(30 - i),
      estimated_value: est,
      final_value: sold ? Math.round(est * (0.92 + rnd(i + 9) * 0.18)) : undefined,
      recycler_id: status === "available" ? undefined : rec.recycler_id,
      status,
      sync: i === 2 ? "pending" : "synced",
      timeline: timelineFor(status, col.general_location, 30 - i),
      handover_id: sold ? `HO-EW-2026-${pad(50 + i, 5)}` : undefined,
    } satisfies Lot;
  });
}

function makeTransactions(lots: Lot[], collectors: Collector[], recyclers: Recycler[]) {
  const txns: Transaction[] = [];
  const trace: Traceability[] = [];
  let n = 1;
  const soldLots = lots.filter((l) => l.recycler_id);
  const extra = 20 - soldLots.length;
  const all = [...soldLots];
  for (let i = 0; i < extra; i++) all.push(soldLots[i % soldLots.length]!);

  all.forEach((lot, i) => {
    const quoted = lot.estimated_value;
    const final = lot.final_value ?? Math.round(quoted * (0.9 + rnd(i + 3) * 0.2));
    const rec = recyclers.find((r) => r.recycler_id === lot.recycler_id) ?? recyclers[0]!;
    const paid = lot.status === "paid";
    const anomaly = final < quoted * 0.75;
    txns.push({
      transaction_id: `TXN-2026-${pad(n, 5)}`,
      lot_id: i < soldLots.length ? lot.lot_id : `${lot.lot_id}-B${i}`,
      collector_id: lot.collector_id,
      material_category: lot.items[0]!.material_category,
      quantity: 1,
      weight: lot.weight,
      quoted_price: quoted,
      final_price: final,
      recycler_id: rec.recycler_id,
      collection_location: lot.collection_location,
      handover_location: rec.location,
      date_time: iso(28 - i),
      payment_status: paid ? (i % 2 ? "cash_paid" : "upi_paid") : "pending",
      transaction_status: lot.status,
      flagged: anomaly ? "Final price is significantly below the recent market range." : undefined,
    });
    if (lot.handover_id && i < soldLots.length) {
      trace.push({
        traceability_id: `TR-${pad(n, 5)}`,
        lot_id: lot.lot_id,
        weight: lot.weight,
        timestamp: iso(28 - i),
        gps_location: `${lot.gps.lat.toFixed(4)}, ${lot.gps.lng.toFixed(4)}`,
        handover_reference: lot.handover_id,
        collector_confirmation: true,
        recycler_confirmation: true,
        transaction_status: lot.status,
        final_price: final,
        collector_id: lot.collector_id,
        recycler_id: rec.recycler_id,
      });
    }
    n++;
  });
  void collectors;
  return { txns, trace };
}

export function buildSeed(): DB {
  const materials = makeMaterials();
  const recyclers = makeRecyclers();
  const collectors = makeCollectors();
  const prices = makePrices(recyclers);
  const lots = makeLots(collectors, recyclers);
  const { txns, trace } = makeTransactions(lots, collectors, recyclers);

  return {
    collectors,
    recyclers,
    materials,
    prices,
    lots,
    transactions: txns,
    traceability: trace,
    notifications: [
      {
        id: "N1",
        type: "offer",
        title: "New recycler offer",
        body: "Green Loop Pvt Ltd offers ₹205/kg for PCB.",
        at: iso(0, 8),
        role: "collector",
        read: false,
      },
      {
        id: "N2",
        type: "price",
        title: "Price change",
        body: "Copper cable price increased in Sangli.",
        at: iso(1, 12),
        role: "collector",
        read: false,
      },
      {
        id: "N3",
        type: "pickup",
        title: "New pickup request",
        body: "Lot EW-2026-000102 awaits your response.",
        at: iso(0, 9),
        role: "recycler",
        read: false,
      },
      {
        id: "N4",
        type: "anomaly",
        title: "Transaction anomaly",
        body: "One transaction is priced far below market range.",
        at: iso(2, 15),
        role: "admin",
        read: false,
      },
    ],
    settings: { commission_pct: 3, pickup_cost: 120, ops_cost: 45 },
    session: null,
    lang: "mr",
    queue: [],
  };
}
