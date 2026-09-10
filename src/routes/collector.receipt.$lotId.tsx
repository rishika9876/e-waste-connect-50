import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useDB, useLang } from "@/lib/store";
import { Btn, Card, EmptyState, money } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/receipt/$lotId")({
  head: () => ({
    meta: [
      { title: "Sale Receipt — E-Waste Setu" },
      { name: "description", content: "Digital receipt for an e-waste lot sold to an authorized recycler." },
      { property: "og:title", content: "Sale Receipt — E-Waste Setu" },
      { property: "og:description", content: "Proof of sale with weight, price and handover reference." },
    ],
  }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { lotId } = useParams({ from: "/collector/receipt/$lotId" });
  const lang = useLang();
  const lot = useDB((d) => d.lots.find((l) => l.lot_id === lotId));
  const txn = useDB((d) => d.transactions.find((x) => x.lot_id === lotId));
  const recycler = useDB((d) => d.recyclers.find((r) => r.recycler_id === lot?.recycler_id));

  if (!lot) return <EmptyState text="Lot not found" />;

  const via = txn?.payment_status === "upi_paid" ? t("upi", lang) : t("cash", lang);

  return (
    <div className="space-y-4 py-2">
      <Link to="/collector/lot/$lotId" params={{ lotId }} className="text-sm font-bold text-primary">
        ← {lot.lot_id}
      </Link>
      <h1 className="text-xl font-extrabold">🧾 {t("receipt", lang)}</h1>

      <Card className="space-y-2">
        <div className="text-center">
          <div className="text-4xl">♻️</div>
          <div className="text-lg font-extrabold">{t("appName", lang)}</div>
          <div className="text-3xl font-black text-primary">{money(lot.final_value ?? 0)}</div>
          <div className="text-xs text-muted-foreground">
            {t("paidVia", lang)} {via}
          </div>
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <Row k="Lot" v={lot.lot_id} />
          {txn && <Row k="Transaction" v={txn.transaction_id} />}
          {lot.handover_id && <Row k={t("handover", lang)} v={lot.handover_id} />}
          <Row k={t("weight", lang)} v={`${lot.weight} kg`} />
          <Row k={t("category", lang)} v={lot.items[0]?.material_category ?? "-"} />
          <Row k={t("recycler", lang)} v={recycler?.recycler_name ?? "-"} />
          <Row k="Location" v={lot.collection_location} />
          <Row k="Date" v={new Date(txn?.date_time ?? lot.created_at).toLocaleString()} />
        </dl>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="outline" onClick={() => window.print()}>
          🖨️ {t("print", lang)}
        </Btn>
        <Link to="/collector/earnings">
          <Btn className="w-full">💵 {t("earnings", lang)}</Btn>
        </Link>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}
