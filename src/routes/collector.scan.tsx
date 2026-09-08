import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { classifyImage, type Classification } from "@/lib/classify";
import { CATEGORIES } from "@/lib/seed";
import { useLang, useSession, useDB, priceFor } from "@/lib/store";
import { createLot } from "@/lib/actions";
import { Btn, Card, money, SpeakButton } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/scan")({
  component: ScanPage,
});

function ScanPage() {
  const lang = useLang();
  const session = useSession()!;
  const navigate = useNavigate();
  const location = useDB(
    (d) => d.collectors.find((c) => c.collector_id === session.id)?.general_location ?? "Sangli",
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState(0);
  const [condition, setCondition] = useState("Used");
  const [category, setCategory] = useState("PCB");

  async function run(dataUrl?: string, hint?: string) {
    setBusy(true);
    setResult(null);
    const r = await classifyImage(dataUrl, hint);
    setResult(r);
    setWeight(r.approx_weight);
    setCondition(r.condition);
    setCategory(r.category);
    setBusy(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setPhoto(url);
      void run(url);
    };
    reader.readAsDataURL(f);
  }

  function confirmAndCreate() {
    const cat = CATEGORIES.find((c) => c.key === category)!;
    const est = Math.round(weight * ((cat.min + cat.max) / 2));
    const lotId = createLot({
      collector_id: session.id,
      items: [{ material_category: cat.key, subcategory: cat.label, weight, condition, photo }],
      description: `${cat.label} • ${condition}`,
      photo,
      location,
      source_type: "Household",
      estimated_value: est,
    });
    toast.success(`Lot ${lotId} created`);
    navigate({ to: "/collector/lot/$lotId", params: { lotId } });
  }

  return (
    <div className="space-y-4 py-2">
      <h1 className="text-2xl font-extrabold">📷 {t("scan", lang)}</h1>

      {!result && !busy && (
        <>
          <Card className="text-center">
            <div className="text-6xl">📷</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Take a photo of the item. No camera? Upload a picture instead.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFile}
            />
            <Btn className="mt-4 w-full text-lg" onClick={() => fileRef.current?.click()}>
              📷 {t("scan", lang)}
            </Btn>
            <Btn variant="outline" className="mt-2 w-full" onClick={() => void run(undefined, "PCB")}>
              ▶️ Demo scan (PCB)
            </Btn>
          </Card>
          <Card>
            <div className="text-sm font-bold">Or pick the material yourself</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => void run(undefined, c.key)}
                  className="rounded-2xl border border-border bg-card p-2 text-center active:scale-95"
                >
                  <div className="text-2xl">{c.icon}</div>
                  <div className="text-[11px] font-bold leading-tight">{c.key}</div>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {busy && (
        <Card className="text-center">
          <div className="animate-pulse text-6xl">🔍</div>
          <p className="mt-3 text-lg font-bold">{t("identifying", lang)}</p>
          <p className="text-xs text-muted-foreground">Rule-based demo engine (not a trained AI model)</p>
        </Card>
      )}

      {result && (
        <>
          {photo && (
            <img src={photo} alt="Captured e-waste" className="h-48 w-full rounded-3xl object-cover" />
          )}
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-muted-foreground">{t("detected", lang)}</div>
                <div className="text-3xl font-extrabold">
                  {result.icon} {category}
                </div>
                <div className="text-sm text-muted-foreground">{result.subcategory}</div>
              </div>
              <SpeakButton
                text={`Detected ${category}. Approximate weight ${weight} kilogram. Estimated value ${result.value_min} to ${result.value_max} rupees.`}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Row label={t("confidence", lang)} value={`${result.confidence}%`} />
              <Row label={t("weight", lang)} value={`${weight} kg`} />
              <Row label={t("condition", lang)} value={condition} />
              <Row
                label={t("estValue", lang)}
                value={`${money(result.value_min)}–${money(result.value_max)}`}
              />
            </dl>

            <p className="mt-3 rounded-xl bg-secondary p-2 text-[11px] text-muted-foreground">
              ⓘ Demo classification engine ({result.engine}). Not a trained AI model — the same
              interface can call a real model later.
            </p>

            {editing && (
              <div className="mt-4 space-y-3 rounded-2xl bg-secondary p-3">
                <label className="block text-sm font-bold">
                  Material
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key}>{c.key}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Weight (kg)
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2"
                  />
                </label>
                <label className="block text-sm font-bold">
                  Condition
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2"
                  >
                    {["Used", "Damaged", "Scrap", "Working"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <Btn className="text-lg" onClick={confirmAndCreate}>
                ✅ {t("confirm", lang)} + {t("createLot", lang)}
              </Btn>
              <div className="grid grid-cols-2 gap-2">
                <Btn
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setPhoto(undefined);
                  }}
                >
                  🔄 {t("scanAgain", lang)}
                </Btn>
                <Btn variant="ghost" onClick={() => setEditing((v) => !v)}>
                  ✏️ {t("edit", lang)}
                </Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-lg font-extrabold">{value}</dd>
    </div>
  );
}

export { priceFor };
