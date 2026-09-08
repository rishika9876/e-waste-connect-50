import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { CATEGORIES, LOCATIONS } from "@/lib/seed";
import { priceFor, useDB, useLang } from "@/lib/store";
import { Btn, Card, money, Sparkline, SpeakButton } from "@/components/ui-kit";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/collector/prices")({
  component: PriceBoard,
});

const TREND = { up: "📈", down: "📉", stable: "➡️" };

function PriceBoard() {
  const lang = useLang();
  const db = useDB((d) => d);
  const [loc, setLoc] = useState("Sangli");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const rows = CATEGORIES.filter(
    (c) =>
      !q ||
      c.key.toLowerCase().includes(q.toLowerCase()) ||
      c.label.toLowerCase().includes(q.toLowerCase()),
  ).map((c) => ({ cat: c, p: priceFor(db, c.key, loc) }));

  return (
    <div className="space-y-4 py-2">
      <h1 className="text-2xl font-extrabold">💰 {t("priceBoard", lang)}</h1>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search material"
          className="min-w-0 flex-1 rounded-2xl border border-input bg-card px-4 py-3"
        />
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          className="rounded-2xl border border-input bg-card px-3 py-3 font-bold"
        >
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ cat, p }) => (
          <Card key={cat.key}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-2xl font-extrabold">
                  {cat.icon} {cat.key}
                </div>
                <div className="text-xs text-muted-foreground">{cat.label}</div>
                <div className="mt-1 text-2xl font-black text-primary">
                  {money(p.min)}–{money(p.max)}
                  <span className="text-sm font-bold text-muted-foreground"> / kg</span>
                </div>
                <div className="text-sm font-bold">
                  {TREND[p.trend]} Current {money(p.current)}/kg · Avg {money(p.avg)} · High{" "}
                  {money(p.highest)}
                </div>
              </div>
              <SpeakButton
                text={
                  lang === "en"
                    ? `${cat.key} price in ${loc} is approximately ${p.current} rupees per kilogram.`
                    : lang === "hi"
                      ? `${loc} में ${cat.key} का दाम लगभग ${p.current} रुपये प्रति किलो है।`
                      : `${loc} मध्ये ${cat.key} चा दर अंदाजे ${p.current} रुपये प्रति किलो आहे.`
                }
              />
            </div>

            <button
              className="mt-2 text-sm font-bold text-primary"
              onClick={() => setOpen(open === cat.key ? null : cat.key)}
            >
              {open === cat.key ? "Hide" : "📊 Price history (30 days)"}
            </button>
            {open === cat.key && (
              <div className="mt-2">
                <Sparkline points={p.history.map((h) => h.value)} />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{p.history[0]?.date}</span>
                  <span>{p.history.at(-1)?.date}</span>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  {p.history.slice(-4).map((h) => (
                    <div key={h.date} className="flex justify-between border-b border-border py-1">
                      <span>{h.date}</span>
                      <span className="font-bold">{money(h.value)}/kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Btn
        variant="deep"
        className="w-full"
        onClick={() =>
          speak(
            rows
              .slice(0, 3)
              .map((r) => `${r.cat.key} ${r.p.current} rupees per kilogram`)
              .join(". "),
            lang,
          )
        }
      >
        🎤 {t("listen", lang)} — top prices
      </Btn>
    </div>
  );
}
