import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getDB, signIn, signOut, useDB, useSession } from "@/lib/store";
import { confirmHandover, makeOffer, recyclerRespond, updateRecycler } from "@/lib/actions";
import { Badge, Btn, Card, ConnectionBar, EmptyState, Stat, money } from "@/components/ui-kit";

export const Route = createFileRoute("/recycler")({
  head: () => ({
    meta: [
      { title: "Recycler Dashboard — E-Waste Setu" },
      {
        name: "description",
        content:
          "Manage incoming e-waste lots, pickup requests, QR handover verification, transactions and analytics.",
      },
      { property: "og:title", content: "Recycler Dashboard — E-Waste Setu" },
      { property: "og:description", content: "Verified supply of e-waste with digital handover proof." },
    ],
  }),
  component: RecyclerDashboard,
});

const TABS = [
  ["overview", "📊 Overview"],
  ["incoming", "📦 Incoming lots"],
  ["requests", "🚚 Pickup requests"],
  ["handover", "🤝 Handover"],
  ["txns", "🧾 Transactions"],
  ["profile", "🏭 Profile & rates"],
] as const;

type Tab = (typeof TABS)[number][0];

function RecyclerDashboard() {
  const session = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const db = useDB((d) => d);

  if (!session || session.role !== "recycler") {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="mx-auto mt-16 max-w-sm space-y-3 text-center">
          <div className="text-5xl">♻️</div>
          <h1 className="text-xl font-extrabold">Recycler portal</h1>
          <p className="text-sm text-muted-foreground">Please log in to continue.</p>
          <Link to="/auth">
            <Btn className="w-full">🔐 Login</Btn>
          </Link>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => {
              const r = getDB().recyclers[0]!;
              signIn({ role: "recycler", id: r.recycler_id, name: r.recycler_name });
            }}
          >
            ▶️ Continue as demo recycler
          </Btn>
        </Card>
      </div>
    );
  }

  const me = db.recyclers.find((r) => r.recycler_id === session.id);
  if (!me) return <EmptyState text="Recycler profile not found" />;

  const myLots = db.lots.filter((l) => l.recycler_id === me.recycler_id);
  const requests = myLots.filter((l) => l.status === "pickup_requested");
  const incoming = db.lots.filter(
    (l) =>
      l.status === "available" &&
      l.items.some((i) => me.materials_accepted.includes(i.material_category)),
  );
  const myTxns = db.transactions.filter((t) => t.recycler_id === me.recycler_id);
  const spend = myTxns.reduce((a, t) => a + t.final_price, 0);
  const kg = myTxns.reduce((a, t) => a + t.weight, 0);

  return (
    <div className="min-h-screen bg-background pb-10">
      <ConnectionBar />
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-deep px-4 py-3 text-deep-foreground">
        <div>
          <div className="text-xs opacity-80">{me.recycler_id}</div>
          <div className="text-lg font-extrabold">♻️ {me.recycler_name}</div>
        </div>
        <button className="text-xs font-bold underline" onClick={signOut}>
          Logout
        </button>
      </header>

      <div className="overflow-x-auto border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl gap-1 px-2 py-2">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="Pickup requests" value={String(requests.length)} tone="text-warning-foreground" />
              <Stat label="Available lots" value={String(incoming.length)} />
              <Stat label="Total purchased" value={money(spend)} tone="text-primary" />
              <Stat label="Material received" value={`${Math.round(kg)} kg`} />
            </div>
            <Card>
              <h2 className="text-sm font-extrabold">📈 Purchases by material</h2>
              <ByMaterial txns={myTxns} />
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold">Authorization</h2>
                <Badge status={me.authorization_status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                CPCB / SPCB No. {me.authorization_number}
              </p>
            </Card>
          </>
        )}

        {tab === "incoming" && (
          <>
            {incoming.length === 0 ? (
              <EmptyState text="No available lots in your categories" />
            ) : (
              incoming.map((l) => (
                <Card key={l.lot_id} className="space-y-2">
                  <LotHead lot={l} />
                  <OfferForm
                    onSend={(rate) => {
                      makeOffer(l.lot_id, me.recycler_id, rate);
                      toast.success(`Offer sent for ${l.lot_id}`);
                    }}
                    suggested={me.offered_rate[l.items[0]?.material_category ?? ""] ?? 100}
                  />
                </Card>
              ))
            )}
          </>
        )}

        {tab === "requests" && (
          <>
            {requests.length === 0 ? (
              <EmptyState text="No pending pickup requests" />
            ) : (
              requests.map((l) => (
                <Card key={l.lot_id} className="space-y-2">
                  <LotHead lot={l} />
                  {l.pickup && (
                    <div className="text-xs font-semibold text-muted-foreground">
                      📅 {l.pickup.date} · {l.pickup.time} · 📍 {l.pickup.location}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Btn
                      onClick={() => {
                        recyclerRespond(l.lot_id, true);
                        toast.success(`Accepted ${l.lot_id}`);
                      }}
                    >
                      ✅ Accept
                    </Btn>
                    <Btn
                      variant="outline"
                      onClick={() => {
                        recyclerRespond(l.lot_id, false);
                        toast(`Declined ${l.lot_id}`);
                      }}
                    >
                      ✖️ Decline
                    </Btn>
                  </div>
                </Card>
              ))
            )}
          </>
        )}

        {tab === "handover" && <HandoverVerify recyclerId={me.recycler_id} />}

        {tab === "txns" && (
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">🧾 Transactions</h2>
              <Btn variant="outline" onClick={() => exportCsv(myTxns)}>
                ⬇️ Export CSV
              </Btn>
            </div>
            {myTxns.length === 0 ? (
              <EmptyState text="No transactions yet" />
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1">Txn</th>
                      <th>Lot</th>
                      <th>Material</th>
                      <th>Weight</th>
                      <th>Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTxns.map((t) => (
                      <tr key={t.transaction_id} className="border-t border-border">
                        <td className="py-1 font-bold">{t.transaction_id}</td>
                        <td>{t.lot_id}</td>
                        <td>{t.material_category}</td>
                        <td>{t.weight} kg</td>
                        <td className="font-bold">{money(t.final_price)}</td>
                        <td>{t.payment_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {tab === "profile" && <ProfileTab recyclerId={me.recycler_id} />}
      </main>
    </div>
  );
}

function LotHead({ lot }: { lot: import("@/lib/types").Lot }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="font-extrabold">{lot.lot_id}</div>
        <div className="text-xs text-muted-foreground">
          {lot.items.map((i) => `${i.material_category} ${i.weight}kg`).join(" · ")}
        </div>
        <div className="text-xs text-muted-foreground">📍 {lot.collection_location}</div>
      </div>
      <div className="text-right">
        <div className="font-black">{money(lot.estimated_value)}</div>
        <div className="text-xs text-muted-foreground">{lot.weight} kg</div>
      </div>
    </div>
  );
}

function OfferForm({ onSend, suggested }: { onSend: (rate: number) => void; suggested: number }) {
  const [rate, setRate] = useState(String(suggested));
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1 text-xs font-bold">
        Offer ₹ / kg
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-input bg-background p-2 font-bold"
        />
      </label>
      <Btn onClick={() => onSend(Number(rate) || 0)}>📨 Send offer</Btn>
    </div>
  );
}

function HandoverVerify({ recyclerId }: { recyclerId: string }) {
  const [code, setCode] = useState("");
  const pending = useDB((d) =>
    d.traceability.filter((x) => x.recycler_id === recyclerId && !x.recycler_confirmation),
  );

  function verify(id: string) {
    const ok = confirmHandover(id.trim());
    if (ok) toast.success(`Handover ${id} verified`);
    else toast.error("Handover reference not found");
    setCode("");
  }

  return (
    <>
      <Card className="space-y-2">
        <h2 className="text-sm font-extrabold">🔍 Verify handover</h2>
        <p className="text-xs text-muted-foreground">
          Scan the collector's QR or type the handover code shown on their phone.
        </p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HO-EW-2026-00051"
            className="flex-1 rounded-2xl border border-input bg-background p-3 font-bold"
          />
          <Btn onClick={() => verify(code)} disabled={!code.trim()}>
            ✅ Verify
          </Btn>
        </div>
      </Card>
      <Card>
        <h2 className="text-sm font-extrabold">⏳ Awaiting your confirmation</h2>
        {pending.length === 0 ? (
          <EmptyState text="Nothing pending" />
        ) : (
          <div className="mt-2 space-y-2">
            {pending.map((h) => (
              <div
                key={h.traceability_id}
                className="flex items-center justify-between rounded-2xl border border-border p-3"
              >
                <div>
                  <div className="font-extrabold">{h.handover_reference}</div>
                  <div className="text-xs text-muted-foreground">
                    {h.lot_id} · {h.weight} kg · {money(h.final_price)}
                  </div>
                </div>
                <Btn onClick={() => verify(h.handover_reference)}>Confirm</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function ProfileTab({ recyclerId }: { recyclerId: string }) {
  const me = useDB((d) => d.recyclers.find((r) => r.recycler_id === recyclerId))!;
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(me.offered_rate).map(([k, v]) => [k, String(v)])),
  );
  const [pickup, setPickup] = useState(me.pickup_available);

  function save() {
    updateRecycler(recyclerId, {
      pickup_available: pickup,
      offered_rate: Object.fromEntries(
        Object.entries(rates).map(([k, v]) => [k, Number(v) || 0]),
      ),
    });
    toast.success("Profile updated");
  }

  return (
    <Card className="space-y-3">
      <div>
        <div className="text-lg font-extrabold">{me.facility_name}</div>
        <div className="text-xs text-muted-foreground">
          📍 {me.location} · ☎️ {me.contact}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} />
        Pickup available
      </label>
      <div>
        <div className="text-sm font-extrabold">Your rates (₹/kg)</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.keys(rates).map((k) => (
            <label key={k} className="text-xs font-bold">
              {k}
              <input
                type="number"
                value={rates[k]}
                onChange={(e) => setRates({ ...rates, [k]: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-input bg-background p-2 font-bold"
              />
            </label>
          ))}
        </div>
      </div>
      <Btn onClick={save}>💾 Save</Btn>
    </Card>
  );
}

function ByMaterial({ txns }: { txns: import("@/lib/types").Transaction[] }) {
  const map = new Map<string, number>();
  for (const t of txns) map.set(t.material_category, (map.get(t.material_category) ?? 0) + t.final_price);
  const max = Math.max(1, ...map.values());
  if (map.size === 0) return <EmptyState text="No purchases yet" />;
  return (
    <div className="mt-2 space-y-2">
      {[...map.entries()].map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-28 truncate text-xs font-bold text-muted-foreground">{k}</span>
          <div className="h-3 flex-1 rounded-full bg-secondary">
            <div className="h-3 rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <span className="w-20 text-right text-xs font-bold">{money(v)}</span>
        </div>
      ))}
    </div>
  );
}

function exportCsv(rows: import("@/lib/types").Transaction[]) {
  const head = "transaction_id,lot_id,material,weight,final_price,payment_status,date\n";
  const body = rows
    .map((r) =>
      [r.transaction_id, r.lot_id, r.material_category, r.weight, r.final_price, r.payment_status, r.date_time].join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}
