import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { recommendRecyclers, useDB, useLang, useSession } from "@/lib/store";
import { requestPickup } from "@/lib/actions";
import { Badge, Btn, Card, EmptyState, money, SpeakButton } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/recyclers")({
  validateSearch: (s: Record<string, unknown>) => ({
    lot: typeof s.lot === "string" ? s.lot : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find Authorized Recycler — E-Waste Setu" },
      { name: "description", content: "Compare verified recyclers by rate, distance and pickup, then request a pickup." },
      { property: "og:title", content: "Find Authorized Recycler — E-Waste Setu" },
      { property: "og:description", content: "Compare verified recyclers and request pickup for your e-waste lot." },
    ],
  }),
  component: FindRecycler,
});

const SLOTS = ["9–11 AM", "11 AM–1 PM", "2–4 PM", "4–6 PM"];

function FindRecycler() {
  const lang = useLang();
  const session = useSession()!;
  const navigate = useNavigate();
  const { lot: lotParam } = Route.useSearch();
  const db = useDB((d) => d);
  const myLots = db.lots.filter((l) => l.collector_id === session.id && l.status === "available");
  const [lotId, setLotId] = useState(lotParam ?? myLots[0]?.lot_id);
  const lot = db.lots.find((l) => l.lot_id === lotId);
  const category = lot?.items[0]?.material_category;
  const list = useMemo(() => recommendRecyclers(db, category, lot?.collection_location), [db, category, lot]);
  const [selected, setSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [slot, setSlot] = useState(SLOTS[0]!);
  const [location, setLocation] = useState(lot?.collection_location ?? "");
  const rec = list.find((r) => r.recycler_id === selected);
  const quote = rec && lot ? Math.round(rec.rate * lot.weight) : 0;

  function submit() {
    if (!lot || !rec) return;
    requestPickup({
      lot_id: lot.lot_id,
      recycler_id: rec.recycler_id,
      date,
      time: slot,
      location: location || lot.collection_location,
      quoted_price: quote,
    });
    toast.success(`${t("requestPickup", lang)} ✓ ${rec.recycler_name}`);
    navigate({ to: "/collector/lot/$lotId", params: { lotId: lot.lot_id } });
  }

  if (!lot) {
    return (
      <div className="space-y-3 py-2">
        <h1 className="text-xl font-extrabold">🚚 {t("findRecycler", lang)}</h1>
        <EmptyState text="Create a lot first, then find a recycler." />
        <Link to="/collector/scan">
          <Btn className="w-full">📷 {t("scan", lang)}</Btn>
        </Link>
      </div>
    );
  }

  if (rec) {
    return (
      <div className="space-y-4 py-2">
        <button className="text-sm font-bold text-primary" onClick={() => setSelected(null)}>
          ← {t("back", lang)}
        </button>
        <h1 className="text-xl font-extrabold">🚚 {t("requestPickup", lang)}</h1>
        <Card>
          <div className="text-lg font-extrabold">{rec.recycler_name}</div>
          <div className="text-xs text-muted-foreground">{rec.facility_name} · {rec.location}</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
            <Mini label={category ?? ""} value={`₹${rec.rate}/kg`} />
            <Mini label={t("weight", lang)} value={`${lot.weight} kg`} />
            <Mini label={t("quotedPrice", lang)} value={money(quote)} />
          </div>
        </Card>
        <Card className="space-y-3">
          <label className="block text-sm font-bold">
            📅 {t("pickupDate", lang)}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-3 text-base" />
          </label>
          <div>
            <div className="text-sm font-bold">🕐 {t("pickupTime", lang)}</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {SLOTS.map((s) => (
                <button key={s} onClick={() => setSlot(s)} className={`rounded-2xl border-2 p-3 text-sm font-bold ${slot === s ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-bold">
            📍 {t("pickupLocation", lang)}
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-3 text-base" />
          </label>
        </Card>
        <Btn className="w-full text-lg" onClick={submit}>
          ✅ {t("requestPickup", lang)} · {money(quote)}
        </Btn>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">🚚 {t("findRecycler", lang)}</h1>
        <SpeakButton text={`${t("findRecycler", lang)}. ${list[0]?.recycler_name ?? ""} ${t("bestMatch", lang)}`} />
      </div>
      {myLots.length > 1 && (
        <select value={lotId} onChange={(e) => setLotId(e.target.value)} className="w-full rounded-2xl border border-input bg-card p-3 font-bold">
          {myLots.map((l) => (
            <option key={l.lot_id} value={l.lot_id}>
              {l.lot_id} · {l.items[0]?.material_category} · {l.weight} kg
            </option>
          ))}
        </select>
      )}
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{lot.lot_id}</div>
          <div className="font-extrabold">{category} · {lot.weight} kg · {lot.collection_location}</div>
        </div>
        <button className="text-sm font-bold text-primary" onClick={() => setCompare((c) => !c)}>
          ⚖️ {t("compare", lang)}
        </button>
      </Card>

      {compare ? (
        <Card className="overflow-x-auto p-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-2">Recycler</th>
                <th className="p-2">₹/kg</th>
                <th className="p-2">Total</th>
                <th className="p-2">km</th>
                <th className="p-2">Pickup</th>
                <th className="p-2">⭐</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.recycler_id} className="border-t border-border font-semibold">
                  <td className="p-2">{r.recycler_name}</td>
                  <td className="p-2">₹{r.rate}</td>
                  <td className="p-2">{money(r.rate * lot.weight)}</td>
                  <td className="p-2">{r.distance_km}</td>
                  <td className="p-2">{r.pickup_available ? "✅" : "—"}</td>
                  <td className="p-2">{r.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.length === 0 && <EmptyState text={t("noData", lang)} />}
          {list.map((r, i) => (
            <Card key={r.recycler_id} className={i === 0 ? "border-2 border-primary" : ""}>
              {i === 0 && <div className="mb-1 text-xs font-black text-primary">🏆 {t("bestMatch", lang)}</div>}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-extrabold">{r.recycler_name}</div>
                  <div className="text-xs text-muted-foreground">{r.facility_name} · {r.location}</div>
                </div>
                <Badge status={r.authorization_status} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Mini label={t("perKg", lang)} value={`₹${r.rate}`} />
                <Mini label="Total" value={money(r.rate * lot.weight)} />
                <Mini label={t("distance", lang)} value={`${r.distance_km} km`} />
                <Mini label="⭐" value={String(r.rating)} />
              </div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground">
                {r.pickup_available ? `🚚 ${t("pickupAvailable", lang)}` : "🏭 Drop-off only"} · 📞 {r.contact}
              </div>
              <Btn className="mt-3 w-full" onClick={() => setSelected(r.recycler_id)}>
                ✅ {t("selectRecycler", lang)}
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-2">
      <div className="text-[10px] font-semibold text-muted-foreground">{label}</div>
      <div className="text-sm font-extrabold">{value}</div>
    </div>
  );
}
