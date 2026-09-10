import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { useDB, useLang } from "@/lib/store";
import { markPayment } from "@/lib/actions";
import { Btn, Card, EmptyState, money } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/payment/$lotId")({
  head: () => ({
    meta: [
      { title: "Record Payment — E-Waste Setu" },
      { name: "description", content: "Record cash or UPI payment received for your e-waste lot." },
      { property: "og:title", content: "Record Payment — E-Waste Setu" },
      { property: "og:description", content: "Confirm the money you received for your lot." },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { lotId } = useParams({ from: "/collector/payment/$lotId" });
  const lang = useLang();
  const navigate = useNavigate();
  const lot = useDB((d) => d.lots.find((l) => l.lot_id === lotId));
  const txn = useDB((d) => d.transactions.find((x) => x.lot_id === lotId));
  const [mode, setMode] = useState<"cash_paid" | "upi_paid">("cash_paid");
  const [amount, setAmount] = useState(String(lot?.final_value ?? txn?.quoted_price ?? ""));

  if (!lot) return <EmptyState text="Lot not found" />;

  const amt = Number(amount) || 0;
  const paid = lot.status === "paid";

  function submit() {
    if (!lot || amt <= 0) return;
    markPayment(lot.lot_id, mode, amt);
    toast.success(`${money(amt)} ${t("completed", lang)}`);
    navigate({ to: "/collector/receipt/$lotId", params: { lotId: lot.lot_id } });
  }

  return (
    <div className="space-y-4 py-2">
      <Link to="/collector/lot/$lotId" params={{ lotId }} className="text-sm font-bold text-primary">
        ← {lot.lot_id}
      </Link>
      <h1 className="text-xl font-extrabold">💳 {t("payment", lang)}</h1>

      {paid ? (
        <>
          <Card className="text-center">
            <div className="text-5xl">✅</div>
            <div className="mt-2 text-2xl font-black">{money(lot.final_value ?? 0)}</div>
            <div className="text-sm text-muted-foreground">{t("completed", lang)}</div>
          </Card>
          <Link to="/collector/receipt/$lotId" params={{ lotId }}>
            <Btn className="w-full">🧾 {t("receipt", lang)}</Btn>
          </Link>
        </>
      ) : (
        <>
          <Card className="space-y-3">
            <div className="text-sm font-bold">{t("paidVia", lang)}</div>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant={mode === "cash_paid" ? "primary" : "outline"} onClick={() => setMode("cash_paid")}>
                💵 {t("cash", lang)}
              </Btn>
              <Btn variant={mode === "upi_paid" ? "primary" : "outline"} onClick={() => setMode("upi_paid")}>
                📱 {t("upi", lang)}
              </Btn>
            </div>
            <label className="block text-sm font-bold">
              💰 {t("amount", lang)}
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-input bg-background p-3 text-2xl font-extrabold"
              />
            </label>
            {txn && (
              <div className="text-xs font-semibold text-muted-foreground">
                {t("quotedPrice", lang)}: {money(txn.quoted_price)} · ⚖️ {lot.weight} kg
              </div>
            )}
          </Card>
          <Btn className="w-full text-lg" onClick={submit} disabled={amt <= 0}>
            ✅ {t("confirmPayment", lang)}
          </Btn>
        </>
      )}
    </div>
  );
}
