import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { useDB, useLang, useSession } from "@/lib/store";
import { Card, EmptyState, money, SyncDot } from "@/components/ui-kit";
import type { Lot } from "@/lib/types";

export const Route = createFileRoute("/collector/lots")({
  component: MyLots,
});

const FILTERS = [
  ["all", "All"],
  ["available", "Available"],
  ["pending", "Pending"],
  ["sold", "Sold"],
] as const;

export function statusLabel(s: Lot["status"]) {
  return {
    available: "🟢 Available for Sale",
    pickup_requested: "🕐 Pickup Requested",
    accepted: "👍 Accepted",
    scheduled: "🚚 Pickup Scheduled",
    collected: "🤝 Material Collected",
    handover_confirmed: "✅ Handover Confirmed",
    paid: "💵 Payment Completed",
  }[s];
}

function MyLots() {
  const lang = useLang();
  const session = useSession()!;
  const lots = useDB((d) => d.lots.filter((l) => l.collector_id === session.id));
  const [f, setF] = useState<(typeof FILTERS)[number][0]>("all");

  const shown = lots.filter((l) =>
    f === "all"
      ? true
      : f === "available"
        ? l.status === "available"
        : f === "sold"
          ? l.status === "paid"
          : l.status !== "available" && l.status !== "paid",
  );

  return (
    <div className="space-y-4 py-2">
      <h1 className="text-2xl font-extrabold">📦 {t("myLots", lang)}</h1>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              f === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 && <EmptyState text={t("noData", lang)} />}

      <div className="space-y-3">
        {shown.map((l) => (
          <Link key={l.lot_id} to="/collector/lot/$lotId" params={{ lotId: l.lot_id }}>
            <Card className="active:scale-[0.99]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-muted-foreground">{l.lot_id}</div>
                  <div className="text-lg font-extrabold">
                    {l.items[0]?.material_category} · {l.weight} kg
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {l.final_value ? money(l.final_value) : `~ ${money(l.estimated_value)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{statusLabel(l.status)}</div>
                  <SyncDot state={l.sync} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
