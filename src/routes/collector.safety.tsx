import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/store";
import { speak } from "@/lib/speech";
import { Btn, Card } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/safety")({
  head: () => ({
    meta: [
      { title: "Safety Guide — E-Waste Setu" },
      { name: "description", content: "Safe handling rules for batteries, CRT glass, circuit boards and cables." },
      { property: "og:title", content: "Safety Guide — E-Waste Setu" },
      { property: "og:description", content: "Simple picture-first safety rules for e-waste collectors." },
    ],
  }),
  component: SafetyPage,
});

const NEVER = [
  ["🔥", "Never burn cables or boards to get copper — the smoke is poisonous."],
  ["🔨", "Never break CRT monitors or tube TVs — the glass dust has lead."],
  ["🔋", "Never puncture, heat or wet a battery — it can explode."],
  ["🧪", "Never use acid to clean boards at home."],
  ["🧒", "Never let children help with dismantling."],
];

const ALWAYS = [
  ["🧤", "Wear thick gloves and closed shoes."],
  ["😷", "Wear a mask when there is dust."],
  ["🌬️", "Work outdoors or in an open, airy place."],
  ["🧼", "Wash hands before eating or drinking."],
  ["📦", "Store batteries separately in a dry plastic box."],
  ["🚑", "If acid or battery liquid touches skin, rinse with water for 15 minutes."],
];

function SafetyPage() {
  const lang = useLang();
  const readAll = () =>
    speak(
      [...NEVER.map((x) => x[1]), ...ALWAYS.map((x) => x[1])].join(". "),
      lang,
    );

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">⚠️ {t("safety", lang)}</h1>
        <Btn variant="outline" onClick={readAll}>
          🔊 {t("listen", lang)}
        </Btn>
      </div>

      <Card className="bg-destructive/10">
        <h2 className="text-lg font-extrabold text-destructive">🚫 {t("dontDo", lang)}</h2>
        <ul className="mt-2 space-y-2">
          {NEVER.map(([icon, text]) => (
            <li key={text} className="flex gap-3 text-sm font-semibold">
              <span className="text-2xl leading-none">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-success/10">
        <h2 className="text-lg font-extrabold text-success">✅ {t("doThis", lang)}</h2>
        <ul className="mt-2 space-y-2">
          {ALWAYS.map(([icon, text]) => (
            <li key={text} className="flex gap-3 text-sm font-semibold">
              <span className="text-2xl leading-none">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-sm font-extrabold">☎️ Emergency</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ambulance 108 · Police 112 · Pollution control complaint: your State Pollution Control Board.
        </p>
      </Card>
    </div>
  );
}
