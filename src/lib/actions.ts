import { getDB, nextHandoverId, nextLotId, nextTxnId, setDB, enqueue } from "./store";
import type { Lot, LotItem, PaymentStatus } from "./types";

function stamp(lot: Lot, step: string, icon: string) {
  lot.timeline.push({
    step,
    icon,
    at: new Date().toISOString(),
    location: lot.collection_location,
  });
}

export function createLot(input: {
  collector_id: string;
  items: LotItem[];
  description: string;
  photo?: string;
  location: string;
  source_type: string;
  estimated_value: number;
}) {
  const db = getDB();
  const lot_id = nextLotId(db);
  const weight = input.items.reduce((a, i) => a + i.weight, 0);
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  setDB((d) => {
    d.lots.unshift({
      lot_id,
      collector_id: input.collector_id,
      items: input.items,
      description: input.description,
      photo: input.photo,
      weight,
      source_type: input.source_type,
      collection_location: input.location,
      gps: { lat: 16.8524, lng: 74.5815 },
      created_at: new Date().toISOString(),
      estimated_value: input.estimated_value,
      status: "available",
      sync: online ? "synced" : "pending",
      timeline: [
        { step: "Material Collected", icon: "📦", at: new Date().toISOString(), location: input.location },
        { step: "Photo Captured", icon: "📷", at: new Date().toISOString(), location: input.location },
        { step: "Weight Recorded", icon: "⚖️", at: new Date().toISOString(), location: input.location },
        { step: "Price Estimated", icon: "💰", at: new Date().toISOString(), location: input.location },
      ],
    });
  });
  enqueue(`Lot ${lot_id} created`);
  return lot_id;
}

export function requestPickup(input: {
  lot_id: string;
  recycler_id: string;
  date: string;
  time: string;
  location: string;
  quoted_price: number;
}) {
  const db = getDB();
  const txnId = nextTxnId(db);
  setDB((d) => {
    const lot = d.lots.find((l) => l.lot_id === input.lot_id);
    if (!lot) return;
    lot.recycler_id = input.recycler_id;
    lot.status = "pickup_requested";
    lot.pickup = { date: input.date, time: input.time, location: input.location };
    stamp(lot, "Recycler Selected", "🚚");
    const rec = d.recyclers.find((r) => r.recycler_id === input.recycler_id);
    d.transactions.unshift({
      transaction_id: txnId,
      lot_id: lot.lot_id,
      collector_id: lot.collector_id,
      material_category: lot.items[0]?.material_category ?? "Mixed",
      quantity: lot.items.length,
      weight: lot.weight,
      quoted_price: input.quoted_price,
      final_price: input.quoted_price,
      recycler_id: input.recycler_id,
      collection_location: lot.collection_location,
      handover_location: rec?.location ?? lot.collection_location,
      date_time: new Date().toISOString(),
      payment_status: "pending",
      transaction_status: "pickup_requested",
    });
    d.notifications.unshift({
      id: `N-${Date.now()}`,
      type: "pickup",
      title: "New pickup request",
      body: `Lot ${lot.lot_id} • ${lot.weight} kg ${lot.items[0]?.material_category ?? ""}`,
      at: new Date().toISOString(),
      role: "recycler",
      read: false,
    });
  });
  enqueue(`Pickup requested for ${input.lot_id}`);
  return txnId;
}

export function recyclerRespond(lot_id: string, accept: boolean, quote?: number) {
  setDB((d) => {
    const lot = d.lots.find((l) => l.lot_id === lot_id);
    const txn = d.transactions.find((t) => t.lot_id === lot_id);
    if (!lot) return;
    if (!accept) {
      lot.status = "available";
      lot.recycler_id = undefined;
      if (txn) txn.transaction_status = "available";
      return;
    }
    lot.status = "scheduled";
    if (quote != null) lot.estimated_value = quote;
    stamp(lot, "Pickup", "📍");
    if (txn) {
      txn.transaction_status = "scheduled";
      if (quote != null) {
        txn.quoted_price = quote;
        txn.final_price = quote;
      }
    }
    d.notifications.unshift({
      id: `N-${Date.now()}`,
      type: "pickup",
      title: "Pickup accepted",
      body: `Lot ${lot_id} scheduled. Quote ${quote != null ? `₹${quote}` : "confirmed"}.`,
      at: new Date().toISOString(),
      role: "collector",
      read: false,
    });
  });
  enqueue(`Recycler response for ${lot_id}`);
}

export function createHandover(lot_id: string, weight: number, finalPrice: number, photo?: string) {
  const db = getDB();
  const handover_id = nextHandoverId(db);
  setDB((d) => {
    const lot = d.lots.find((l) => l.lot_id === lot_id);
    if (!lot) return;
    lot.weight = weight;
    lot.final_value = finalPrice;
    lot.handover_id = handover_id;
    lot.status = "collected";
    if (photo) lot.photo = photo;
    stamp(lot, "Handover", "🤝");
    const txn = d.transactions.find((t) => t.lot_id === lot_id);
    if (txn) {
      txn.weight = weight;
      txn.final_price = finalPrice;
      txn.transaction_status = "collected";
      if (finalPrice < txn.quoted_price * 0.75) {
        txn.flagged = "Final price is significantly below the recent market range.";
      }
    }
    d.traceability.unshift({
      traceability_id: `TR-${Date.now()}`,
      lot_id,
      photograph_reference: photo ? "captured" : undefined,
      weight,
      timestamp: new Date().toISOString(),
      gps_location: `${lot.gps.lat.toFixed(4)}, ${lot.gps.lng.toFixed(4)}`,
      handover_reference: handover_id,
      collector_confirmation: true,
      recycler_confirmation: false,
      transaction_status: "collected",
      final_price: finalPrice,
      collector_id: lot.collector_id,
      recycler_id: lot.recycler_id ?? "",
    });
  });
  enqueue(`Handover ${handover_id} recorded`);
  return handover_id;
}

export function confirmHandover(handover_id: string) {
  let ok = false;
  setDB((d) => {
    const tr = d.traceability.find((x) => x.handover_reference === handover_id);
    if (!tr) return;
    ok = true;
    tr.recycler_confirmation = true;
    tr.transaction_status = "handover_confirmed";
    const lot = d.lots.find((l) => l.lot_id === tr.lot_id);
    if (lot) {
      lot.status = "handover_confirmed";
      stamp(lot, "Recycler Confirmed", "✅");
    }
    const txn = d.transactions.find((t) => t.lot_id === tr.lot_id);
    if (txn) txn.transaction_status = "handover_confirmed";
    d.notifications.unshift({
      id: `N-${Date.now()}`,
      type: "handover",
      title: "Handover confirmed",
      body: `${handover_id} verified by recycler.`,
      at: new Date().toISOString(),
      role: "collector",
      read: false,
    });
  });
  enqueue(`Handover ${handover_id} verified`);
  return ok;
}

export function markPayment(lot_id: string, status: PaymentStatus, amount: number) {
  setDB((d) => {
    const txn = d.transactions.find((t) => t.lot_id === lot_id);
    if (txn) {
      txn.payment_status = status;
      txn.final_price = amount;
      txn.transaction_status = "paid";
    }
    const lot = d.lots.find((l) => l.lot_id === lot_id);
    if (lot) {
      lot.status = "paid";
      lot.final_value = amount;
      stamp(lot, "Payment", "💵");
      stamp(lot, "Recycling", "♻️");
    }
    d.notifications.unshift({
      id: `N-${Date.now()}`,
      type: "payment",
      title: "Payment received",
      body: `₹${amount} for ${lot_id}.`,
      at: new Date().toISOString(),
      role: "collector",
      read: false,
    });
  });
  enqueue(`Payment recorded for ${lot_id}`);
}
