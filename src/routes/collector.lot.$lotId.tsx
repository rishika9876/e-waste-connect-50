import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useDB, useLang } from "@/lib/store";
import { Badge, Btn, Card, EmptyState, money, SyncDot } from "@/components/ui-kit";
import { statusLabel } from "./collector.lots";

export const Route = createFileRoute("/collector/lot/$lotId")({
  component: LotDetail,
});

function LotDetail() {
  const { lotId } = useParams({ from: "/collector/lot/$lotId" });
  const lang = useLang();
  const lot = useDB((d) => d.lots.find((l) => l.lot_id === lotId));
  const recycler = useDB((d) => d.recyclers.find((r) => r.recycler_id === lot?.recycler_id));
  const txn = useDB((d) => d.transactions.find((x) => x.lot_id === lotId));

  if (!lot) return <EmptyState text="Lot not found" />;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">📦 {lot.lot_id}</h1>
        <SyncDot state={lot.sync} />
      </div>

      {lot.photo && <img src={lot.photo} alt="Lot" className="h-44 w-full rounded-3xl object-cover" />}

      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Material" value={lot.items.map((i) => i.material_category).join(", ")} />
          <Info label={t("weight", lang)} value={`${lot.weight} kg`} />
          <Info label={t("estValue", lang)} value={money(lot.estimated_value)} />
          <Info label="Final value" value={lot.final_value ? money(lot.final_value) : "—"} />
          <Info label="Location" value={lot.collection_location} />
          <Info label="Source" value={lot.source_type} />
          <Info label="Created" value={new Date(lot.created_at).toLocaleString("en-IN")} />
          <Info label={t("status", lang)} value={statusLabel(lot.status)} />
        </div>
        {lot.handover_id && (
          <div className="mt-3 rounded-2xl bg-secondary p-3 text-sm font-bold">
            🤝 Handover: {lot.handover_id}
          </div>
        )}
      </Card>

      {recycler && (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold">{recycler.recycler_name}</div>
              <div className="text-xs text-muted-foreground">
                {recycler.facility_name} · {recycler.location}
              </div>
            </div>
            <Badge status={recycler.authorization_status} />
          </div>
        </Card>
      )}

      <div className="grid gap-2">
        {lot.status === "available" && (
          <Link to="/collector/recyclers" search={{ lot: lot.lot_id }}>
            <Btn className="w-full text-lg">🚚 {t("findRecycler", lang)}</Btn>
          </Link>
        )}
        {(lot.status === "scheduled" || lot.status === "accepted") && (
          <Link to="/collector/handover/$lotId" params={{ lotId: lot.lot_id }}>
            <Btn className="w-full text-lg">🤝 Start handover</Btn>
          </Link>
        )}
        {lot.status === "collected" && (
          <Link to="/collector/handover/$lotId" params={{ lotId: lot.lot_id }}>
            <Btn className="w-full text-lg">📷 Show handover QR</Btn>
          </Link>
        )}
        {lot.status === "handover_confirmed" && (
          <Link to="/collector/payment/$lotId" params={{ lotId: lot.lot_id }}>
            <Btn className="w-full text-lg">💳 {t("payment", lang)}</Btn>
          </Link>
        )}
        {lot.status === "paid" && (
          <Link to="/collector/receipt/$lotId" params={{ lotId: lot.lot_id }}>
            <Btn variant="deep" className="w-full text-lg">
              🧾 View receipt
            </Btn>
          </Link>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-extrabold">🔗 Traceability timeline</h2>
        <ol className="mt-3 space-y-3">
          {lot.timeline.map((e, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="text-xl">{e.icon}</span>
                {i < lot.timeline.length - 1 && <span className="my-1 h-full w-px flex-1 bg-border" />}
              </div>
              <div className="pb-2">
                <div className="font-bold">{e.step}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.at).toLocaleString("en-IN")} · 📍 {e.location}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {txn?.flagged && (
        <Card className="border-warning bg-warning/20">
          <div className="font-bold">⚠️ {txn.flagged}</div>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
