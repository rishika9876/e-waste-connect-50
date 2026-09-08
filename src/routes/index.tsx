import { createFileRoute, Link } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/store";
import { Btn, Card, LanguageSwitcher, SpeakButton } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E-Waste Setu — Fair Value for Every Kilogram of E-Waste" },
      {
        name: "description",
        content:
          "E-Waste Setu connects informal scrap collectors with authorized recyclers: scan e-waste, see fair prices, request pickup, and keep a digital record.",
      },
      { property: "og:title", content: "E-Waste Setu — Fair Value for Every Kilogram of E-Waste" },
      {
        property: "og:description",
        content:
          "Scan e-waste, get fair prices, find authorized recyclers, sell safely and keep a traceable digital record.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  ["📷", "Scan / Add E-Waste", "फोटो काढा", "फोटो लें"],
  ["💰", "Get Fair Price", "योग्य दर", "सही दाम"],
  ["🚚", "Find Authorized Recycler", "अधिकृत रिसायकलर", "अधिकृत रीसायक्लर"],
  ["💵", "Sell & Get Paid", "विका आणि पैसे मिळवा", "बेचें और पैसे पाएं"],
];

function Landing() {
  const lang = useLang();
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 text-lg font-extrabold text-deep">
          ♻️ {t("appName", lang)}
        </div>
        <LanguageSwitcher compact />
      </header>

      <section className="bg-deep px-5 pb-8 pt-6 text-deep-foreground">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{t("tagline", lang)}</h1>
        <div className="mt-3 flex items-start gap-3">
          <p className="text-base opacity-90">{t("heroSub", lang)}</p>
          <SpeakButton text={`${t("tagline", lang)}. ${t("heroSub", lang)}`} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/auth">
            <Btn className="w-full">👤 {t("login", lang)}</Btn>
          </Link>
          <Link to="/auth">
            <Btn variant="ghost" className="w-full">
              📝 {t("register", lang)}
            </Btn>
          </Link>
          <Link to="/collector/scan">
            <Btn variant="ghost" className="w-full">
              📷 {t("scan", lang)}
            </Btn>
          </Link>
          <Link to="/collector/prices">
            <Btn variant="ghost" className="w-full">
              💰 {t("price", lang)}
            </Btn>
          </Link>
        </div>
      </section>

      <section className="px-4 py-8">
        <h2 className="text-xl font-extrabold">How it works</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([icon, en, mr, hi], i) => (
            <Card key={en}>
              <div className="text-3xl">{icon}</div>
              <div className="mt-2 text-xs font-bold text-primary">STEP {i + 1}</div>
              <div className="text-base font-bold">{lang === "mr" ? mr : lang === "hi" ? hi : en}</div>
              <div className="text-xs text-muted-foreground">{en}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-3 px-4 pb-8 lg:grid-cols-3">
        <Card>
          <h3 className="text-lg font-extrabold">Why formal recycling?</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>♻️ Authorized facilities recover more metal, safely.</li>
            <li>💰 Transparent, recorded prices instead of guesswork.</li>
            <li>📄 Every lot has a digital trail you can show.</li>
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-extrabold">⚠️ Safety first</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>🔥 Never burn cables in open air.</li>
            <li>☠️ Never use acid to recover metals.</li>
            <li>🧤 Always use gloves and protection.</li>
          </ul>
          <Link to="/collector/safety" className="mt-3 inline-block text-sm font-bold text-primary">
            See safety guide →
          </Link>
        </Card>
        <Card>
          <h3 className="text-lg font-extrabold">Benefits</h3>
          <p className="mt-2 text-sm font-bold">For collectors</p>
          <p className="text-sm text-muted-foreground">
            Better rates, pickup at your location, earnings ledger, no paperwork.
          </p>
          <p className="mt-2 text-sm font-bold">For recyclers</p>
          <p className="text-sm text-muted-foreground">
            Steady verified supply, weight & handover proof, lower sourcing cost.
          </p>
        </Card>
      </section>

      <section className="px-4 pb-10">
        <Card className="bg-secondary">
          <h3 className="text-lg font-extrabold">About the platform</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            E-Waste Setu is an offline-tolerant, vernacular platform linking informal collectors to
            authorized recyclers. Material identification and price estimation currently use a
            transparent rule-based demo engine — the data model is ready for real ML models,
            live GPS and payment integrations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/recycler">
              <Btn variant="outline">♻️ Recycler portal</Btn>
            </Link>
            <Link to="/admin">
              <Btn variant="outline">📊 Admin dashboard</Btn>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
