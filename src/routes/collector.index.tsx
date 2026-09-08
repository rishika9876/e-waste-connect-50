import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { collectorStats, useDB, useLang, useSession } from "@/lib/store";
import { BigTile, Card, money, SpeakButton, Stat } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/")({
  component: CollectorHome,
});

function CollectorHome() {
  const lang = useLang();
  const session = useSession()!;
  const stats = useDB((d) => collectorStats(d, session.id));

  const spoken =
    lang === "en"
      ? `Your total earnings are ${stats.total} rupees. ${stats.pending} rupees are pending. Tap the big camera button to scan e-waste.`
      : lang === "hi"
        ? `आपकी कुल कमाई ${stats.total} रुपये है। ${stats.pending} रुपये बाकी हैं। ई-कचरा स्कैन करने के लिए कैमरा बटन दबाएं।`
        : `तुमची एकूण कमाई ${stats.total} रुपये आहे. ${stats.pending} रुपये बाकी आहेत. ई-कचरा स्कॅन करण्यासाठी कॅमेरा बटण दाबा.`;

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("totalEarnings", lang)} value={money(stats.total)} tone="text-primary" />
        <Stat label={t("pendingPayment", lang)} value={money(stats.pending)} tone="text-warning-foreground" />
        <Stat label={t("lotsSold", lang)} value={String(stats.lotsSold)} />
        <Stat label={t("transactions", lang)} value={String(stats.txnCount)} />
      </div>

      <Card className="flex items-center justify-between gap-3 bg-accent">
        <div>
          <div className="text-sm font-bold">🎤 {t("voice", lang)}</div>
          <p className="text-xs text-muted-foreground">Tap to hear what this screen says.</p>
        </div>
        <SpeakButton text={spoken} className="size-14 bg-card text-2xl" />
      </Card>

      <div className="tile-grid">
        <BigTile to="/collector/scan" icon="📷" label={t("scan", lang)} />
        <BigTile to="/collector/prices" icon="💰" label={t("price", lang)} tone="deep" />
        <BigTile to="/collector/lots" icon="📦" label={t("myLots", lang)} tone="card" />
        <BigTile to="/collector/recyclers" icon="🚚" label={t("findRecycler", lang)} tone="card" />
        <BigTile to="/collector/earnings" icon="💵" label={t("earnings", lang)} tone="card" />
        <BigTile to="/collector/safety" icon="⚠️" label={t("safety", lang)} tone="warning" />
      </div>
    </div>
  );
}
