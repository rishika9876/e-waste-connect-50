import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useDB, useLang } from "@/lib/store";
import { createHandover } from "@/lib/actions";
import { Btn, Card, EmptyState, money } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/handover/$lotId")({
  head: () => ({
    meta: [
      { title: "Handover with QR — E-Waste Setu" },
      { name: "description", content: "Confirm final weight and price and show a handover QR code to the recycler." },
      { property: "og:title", content: "Handover with QR — E-Waste Setu" },
      { property: "og:description", content: "Digital handover proof for your e-waste lot." },
    ],
  }),
  component: Handover,
});

export function useQr(payload: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!payload) return;
    QRCode.toDataURL(payload, { width: 320, margin: 1 }).then(setUrl).catch(() => setUrl(null));
  }, [payload]);
  return url;
}

function Handover() {
  const { lotId } = useParams({ from: "/collector/handover/$lotId" });
  const lang = useLang();
  const lot = useDB((d) => d.lots.find((l) => l.lot_id === lotId));
  const txn = useDB((d) => d.transactions.find((x) => x.lot_id === lotId));
  const recycler = useDB((d) => d.recyclers.find((r) => r.recycler_id === lot?.recycler_id));
  const [weight, setWeight] = useState(String(lot?.weight ?? ""));
  const [price, setPrice] = useState(String(txn?.quoted_price ?? lot?.estimated_value ?? ""));
  const [photo, setPhoto] = useState<string | undefined>();

  const done = lot?.handover_id != null;
  const payload = done && lot
    ? JSON.stringify({
        v: 1,
        lot: lot.lot_id,
        handover: lot.handover_id,
        weight: lot.weight,
        price: lot.final_value,
        recycler: lot.recycler_id,
        at: lot.timeline.at(-1)?.at,
      })
    : null;
  const qr = useQr(payload);

  if (!lot) return <EmptyState text="Lot not found" />;

  const w = Number(weight) || 0;
  const p = Number(price) || 0;
  const low = txn && p < txn.quoted_price * 0.75;

  function submit() {
    if (!lot || w <= 0 || p <= 0) return;
    const id = createHandover(lot.lot_id, w, p, photo);
    toast.success(`${t("handover", lang)} ${id}`);
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(f);
  }

  return (
    <div className="space-y-4 py-2">
      <Link to="/collector/lot/$lotId" params={{ lotId }} className="text-sm font-bold text-primary">
        ← {lot.lot_id}
      </Link>
      <h1 className="text-xl font-extrabold">🤝 {t("handover", lang)}</h1>

      {recycler && (
        <Card>
          <div className="text-xs text-muted-foreground">Recycler</div>
          <div className="font-extrabold">{recycler.recycler_name}</div>
          {lot.pickup && (
            <div className="text-xs text-muted-foreground">
              📅 {lot.pickup.date} · {lot.pickup.time} · 📍 {lot.pickup.location}
            </div>
          )}
        </Card>
      )}

      {!done ? (
        <>
          <Card className="space-y-3">
            <label className="block text-sm font-bold">
              ⚖️ {t("finalWeight", lang)}
              <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-3 text-2xl font-extrabold" />
            </label>
            <label className="block text-sm font-bold">
              💰 {t("finalPrice", lang)}
              <input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-3 text-2xl font-extrabold" />
            </label>
            {txn && (
              <div className="text-xs font-semibold text-muted-foreground">
                {t("quotedPrice", lang)}: {money(txn.quoted_price)} · {t("estValue", lang)}: {money(lot.estimated_value)}
              </div>
            )}
            {low && (
              <div className="rounded-2xl bg-warning/25 p-3 text-sm font-bold">
                ⚠️ This price is far below the quote. You can refuse and ask for the agreed rate.
              </div>
            )}
            <label className="block">
              <div className="text-sm font-bold">📷 Photo at handover (optional)</div>
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="mt-1 block w-full text-sm" />
              {photo && <img src={photo} alt="Handover" className="mt-2 h-36 w-full rounded-2xl object-cover" />}
            </label>
          </Card>
          <Btn className="w-full text-lg" onClick={submit} disabled={w <= 0 || p <= 0}>
            ✅ {t("generateQr", lang)}
          </Btn>
        </>
      ) : (
        <>
          <Card className="text-center">
            <div className="text-sm font-bold text-primary">{t("showQr", lang)}</div>
            {qr ? (
              <img src={qr} alt={`Handover QR ${lot.handover_id}`} className="mx-auto mt-3 size-64 rounded-2xl bg-card" />
            ) : (
              <div className="mx-auto mt-3 size-64 animate-pulse rounded-2xl bg-secondary" />
            )}
            <div className="mt-3 text-2xl font-black tracking-wider">{lot.handover_id}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {lot.weight} kg · {money(lot.final_value ?? 0)}
            </div>
          </Card>
          {lot.status === "collected" ? (
            <Card className="bg-secondary text-center font-bold">⏳ {t("waitingRecycler", lang)}</Card>
          ) : (
            <Link to="/collector/payment/$lotId" params={{ lotId }}>
              <Btn className="w-full text-lg">💳 {t("payment", lang)} →</Btn>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
