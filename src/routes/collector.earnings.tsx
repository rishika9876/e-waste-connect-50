import { createFileRoute, Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { collectorStats, useDB, useLang, useSession } from "@/lib/store";
import { Card, EmptyState, Stat, money } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/earnings")({
  head: () => ({
    meta: [
      { title: "My Earnings — E-Waste Setu" },
      { name: "description", content: "Track your e-waste earnings, pending payments and transaction ledger." },
      { property: "og:title", content: "My Earnings — E-Waste Setu" },
      { property: "og:description", content: "A clear ledger of every lot you sold and every rupee earned." },
    ],
  }),
  component: EarningsPage,
});

function EarningsPage() {
  const lang = useLang();
  const session = useSession();
  const stats = useDB((d) => collectorStats(d, session?.id ?? ""));
  const recyclers = useDB((d) => d.recyclers);

  const byMaterial = new Map<string, number>();
  for (const tx of stats.txns) {
    byMaterial.set(tx.material_category, (byMaterial.get(tx.material_category) ?? 0) + tx.final_price);
  }
  const byMonth = new Map<string, number>();
  for (const tx of stats.txns) {
    const m = tx.date_time.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + tx.final_price);
  }
  const maxMonth = Math.max(1, ...byMonth.values());

  return (
    <div className="space-y-4 py-2">
      <h1 className="text-xl font-extrabold">💵 {t("earnings", lang)}</h1>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("totalEarnings", lang)} value={money(stats.completed)} tone="text-primary" />
        <Stat label={t("pendingPayment", lang)} value={money(stats.pending)} tone="text-warning-foreground" />
        <Stat label={t("lotsSold", lang)} value={String(stats.lotsSold)} />
        <Stat label={t("transactions", lang)} value={String(stats.txnCount)} />
      </div>

      {byMonth.size > 0 && (
        <Card>
          <h2 className="text-sm font-extrabold">📈 {t("monthly", lang)}</h2>
          <div className="mt-3 space-y-2">
            {[...byMonth.entries()].sort().map(([m, v]) => (
              <div key={m} className="flex items-center gap-2">
                <span className="w-16 text-xs font-bold text-muted-foreground">{m}</span>
                <div className="h-3 flex-1 rounded-full bg-secondary">
                  <div className="h-3 rounded-full bg-primary" style={{ width: `${(v / maxMonth) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-xs font-bold">{money(v)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byMaterial.size > 0 && (
        <Card>
          <h2 className="text-sm font-extrabold">🧩 {t("byMaterial", lang)}</h2>
          <div className="mt-2 space-y-1 text-sm">
            {[...byMaterial.entries()].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border py-1 last:border-0">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-bold">{money(v)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-extrabold">📒 {t("ledger", lang)}</h2>
        {stats.txns.length === 0 ? (
          <EmptyState text={t("noData", lang)} />
        ) : (
          <div className="mt-2 space-y-2">
            {[...stats.txns]
              .sort((a, b) => +new Date(b.date_time) - +new Date(a.date_time))
              .map((tx) => {
                const r = recyclers.find((x) => x.recycler_id === tx.recycler_id);
                const done = tx.payment_status === "cash_paid" || tx.payment_status === "upi_paid";
                return (
                  <Link key={tx.transaction_id} to="/collector/lot/$lotId" params={{ lotId: tx.lot_id }}>
                    <div className="flex items-center justify-between rounded-2xl border border-border p-3">
                      <div>
                        <div className="text-sm font-extrabold">{tx.lot_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {tx.material_category} · {tx.weight} kg · {r?.recycler_name ?? tx.recycler_id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.date_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black">{money(tx.final_price)}</div>
                        <div className={`text-xs font-bold ${done ? "text-success" : "text-warning-foreground"}`}>
                          {done ? "✓ " + t("completed", lang) : "⏳ " + t("pendingPayment", lang)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </Card>
    </div>
  );
}
