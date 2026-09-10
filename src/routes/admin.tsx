import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { signIn, signOut, useDB, useSession, resetDemoData } from "@/lib/store";
import { LOCATIONS, CATEGORIES } from "@/lib/seed";
import {
  deleteMaterial,
  resolveFlag,
  setRecyclerStatus,
  updateSettings,
  upsertMaterial,
  upsertPrice,
} from "@/lib/actions";
import { Badge, Btn, Card, ConnectionBar, EmptyState, Stat, money } from "@/components/ui-kit";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — E-Waste Setu" },
      {
        name: "description",
        content:
          "Verify recyclers, manage prices and materials, review transactions and lots, and track platform analytics.",
      },
      { property: "og:title", content: "Admin Dashboard — E-Waste Setu" },
      { property: "og:description", content: "Run the e-waste platform end to end." },
    ],
  }),
  component: AdminDashboard,
});

const TABS = [
  ["overview", "📊 Overview"],
  ["recyclers", "✅ Verification"],
  ["prices", "💰 Prices"],
  ["materials", "🧩 Materials"],
  ["txns", "🧾 Transactions"],
  ["lots", "📦 Lots"],
  ["settings", "⚙️ Settings"],
] as const;

type Tab = (typeof TABS)[number][0];

function AdminDashboard() {
  const session = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const db = useDB((d) => d);

  if (!session || session.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="mx-auto mt-16 max-w-sm space-y-3 text-center">
          <div className="text-5xl">📊</div>
          <h1 className="text-xl font-extrabold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Please log in to continue.</p>
          <Link to="/auth">
            <Btn className="w-full">🔐 Login</Btn>
          </Link>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => signIn({ role: "admin", id: "ADMIN-001", name: "Platform Admin" })}
          >
            ▶️ Continue as demo admin
          </Btn>
        </Card>
      </div>
    );
  }

  const totalValue = db.transactions.reduce((a, t) => a + t.final_price, 0);
  const totalKg = db.transactions.reduce((a, t) => a + t.weight, 0);
  const pendingRecyclers = db.recyclers.filter((r) => r.authorization_status === "pending");
  const flagged = db.transactions.filter((t) => t.flagged);

  return (
    <div className="min-h-screen bg-background pb-10">
      <ConnectionBar />
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-deep px-4 py-3 text-deep-foreground">
        <div>
          <div className="text-xs opacity-80">{session.id}</div>
          <div className="text-lg font-extrabold">📊 Platform Admin</div>
        </div>
        <button className="text-xs font-bold underline" onClick={signOut}>
          Logout
        </button>
      </header>

      <div className="overflow-x-auto border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl gap-1 px-2 py-2">
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

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Stat label="Collectors" value={String(db.collectors.length)} />
              <Stat label="Recyclers" value={String(db.recyclers.length)} />
              <Stat label="Lots" value={String(db.lots.length)} />
              <Stat label="Transactions" value={String(db.transactions.length)} />
              <Stat label="Traded value" value={money(totalValue)} tone="text-primary" />
              <Stat label="Material diverted" value={`${Math.round(totalKg)} kg`} />
              <Stat label="Pending verification" value={String(pendingRecyclers.length)} tone="text-warning-foreground" />
              <Stat label="Flagged" value={String(flagged.length)} tone="text-destructive" />
            </div>
            <Card>
              <h2 className="text-sm font-extrabold">🌍 Estimated CO₂e avoided</h2>
              <p className="mt-1 text-2xl font-black text-success">
                {Math.round(totalKg * 1.8)} kg CO₂e
              </p>
              <p className="text-xs text-muted-foreground">
                Assumes ~1.8 kg CO₂e avoided per kg of e-waste formally recycled.
              </p>
            </Card>
            {flagged.length > 0 && (
              <Card>
                <h2 className="text-sm font-extrabold">🚩 Flagged transactions</h2>
                <div className="mt-2 space-y-2">
                  {flagged.map((t) => (
                    <div key={t.transaction_id} className="flex items-center justify-between rounded-2xl border border-border p-3">
                      <div>
                        <div className="font-bold">{t.transaction_id}</div>
                        <div className="text-xs text-muted-foreground">{t.flagged}</div>
                      </div>
                      <Btn variant="outline" onClick={() => resolveFlag(t.transaction_id)}>
                        Resolve
                      </Btn>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {tab === "recyclers" &&
          db.recyclers.map((r) => (
            <Card key={r.recycler_id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold">{r.recycler_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.facility_name} · 📍 {r.location} · ⭐ {r.rating}
                  </div>
                  <div className="text-xs text-muted-foreground">Auth: {r.authorization_number}</div>
                </div>
                <Badge status={r.authorization_status} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => { setRecyclerStatus(r.recycler_id, "verified"); toast.success("Verified"); }}>
                  ✅ Verify
                </Btn>
                <Btn variant="outline" onClick={() => setRecyclerStatus(r.recycler_id, "pending")}>
                  🟡 Pending
                </Btn>
                <Btn variant="outline" onClick={() => setRecyclerStatus(r.recycler_id, "rejected")}>
                  🔴 Reject
                </Btn>
                <Btn variant="outline" onClick={() => setRecyclerStatus(r.recycler_id, "suspended")}>
                  ⛔ Suspend
                </Btn>
              </div>
            </Card>
          ))}

        {tab === "prices" && <PricesTab />}

        {tab === "materials" && <MaterialsTab />}

        {tab === "txns" && (
          <Card className="overflow-x-auto">
            <h2 className="text-sm font-extrabold">🧾 All transactions</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1">Txn</th>
                  <th>Lot</th>
                  <th>Collector</th>
                  <th>Recycler</th>
                  <th>Weight</th>
                  <th>Value</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {db.transactions.map((t) => (
                  <tr key={t.transaction_id} className="border-t border-border">
                    <td className="py-1 font-bold">{t.transaction_id}</td>
                    <td>{t.lot_id}</td>
                    <td>{t.collector_id}</td>
                    <td>{t.recycler_id}</td>
                    <td>{t.weight} kg</td>
                    <td className="font-bold">{money(t.final_price)}</td>
                    <td>{t.payment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "lots" && (
          <Card className="overflow-x-auto">
            <h2 className="text-sm font-extrabold">📦 All lots</h2>
            <table className="mt-2 w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1">Lot</th>
                  <th>Collector</th>
                  <th>Material</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Sync</th>
                </tr>
              </thead>
              <tbody>
                {db.lots.map((l) => (
                  <tr key={l.lot_id} className="border-t border-border">
                    <td className="py-1 font-bold">{l.lot_id}</td>
                    <td>{l.collector_id}</td>
                    <td>{l.items[0]?.material_category}</td>
                    <td>{l.weight} kg</td>
                    <td>{l.status}</td>
                    <td>{l.sync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function PricesTab() {
  const prices = useDB((d) => d.prices.slice(0, 40));
  const [cat, setCat] = useState(CATEGORIES[0]!.key);
  const [loc, setLoc] = useState(LOCATIONS[0]!);
  const [buy, setBuy] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  return (
    <>
      <Card className="space-y-2">
        <h2 className="text-sm font-extrabold">💰 Publish a price</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-2xl border border-input bg-background p-2 text-sm font-bold">
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.icon} {c.key}
              </option>
            ))}
          </select>
          <select value={loc} onChange={(e) => setLoc(e.target.value)} className="rounded-2xl border border-input bg-background p-2 text-sm font-bold">
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <input value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="Buying ₹/kg" type="number" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
          <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="Range min" type="number" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
          <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="Range max" type="number" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
        </div>
        <Btn
          onClick={() => {
            if (!Number(buy)) return toast.error("Enter a buying price");
            upsertPrice({
              material_category: cat,
              location: loc,
              buying_price: Number(buy),
              market_range_min: Number(min) || Math.round(Number(buy) * 0.85),
              market_range_max: Number(max) || Math.round(Number(buy) * 1.15),
            });
            toast.success("Price published");
            setBuy("");
            setMin("");
            setMax("");
          }}
        >
          📢 Publish
        </Btn>
      </Card>
      <Card className="overflow-x-auto">
        <h2 className="text-sm font-extrabold">Latest prices</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1">Material</th>
              <th>Location</th>
              <th>Buying</th>
              <th>Range</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.price_id} className="border-t border-border">
                <td className="py-1 font-bold">{p.material_category}</td>
                <td>{p.location}</td>
                <td>{money(p.buying_price)}</td>
                <td>
                  {p.market_range_min}–{p.market_range_max}
                </td>
                <td>{new Date(p.date_time).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function MaterialsTab() {
  const materials = useDB((d) => d.materials);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("♻️");
  const [value, setValue] = useState("");

  return (
    <>
      <Card className="space-y-2">
        <h2 className="text-sm font-extrabold">🧩 Add material category</h2>
        <div className="grid grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Est. ₹/kg" type="number" className="rounded-2xl border border-input bg-background p-2 text-sm font-bold" />
        </div>
        <Btn
          onClick={() => {
            if (!name.trim()) return toast.error("Enter a category name");
            upsertMaterial({ category: name.trim(), icon, estimated_value: Number(value) || 0 });
            toast.success("Material saved");
            setName("");
            setValue("");
          }}
        >
          ➕ Add
        </Btn>
      </Card>
      {materials.length === 0 ? (
        <EmptyState text="No materials" />
      ) : (
        <Card>
          <div className="space-y-1">
            {materials.map((m) => (
              <div key={m.material_id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div>
                  <div className="font-bold">
                    {m.icon} {m.category}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.subcategory}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{money(m.estimated_value)}</span>
                  <button className="text-sm font-bold text-destructive" onClick={() => deleteMaterial(m.material_id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function SettingsTab() {
  const settings = useDB((d) => d.settings);
  const [commission, setCommission] = useState(String(settings.commission_pct));
  const [pickupCost, setPickupCost] = useState(String(settings.pickup_cost));
  const [ops, setOps] = useState(String(settings.ops_cost));

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-extrabold">⚙️ Platform settings</h2>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs font-bold">
          Commission %
          <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-2 font-bold" />
        </label>
        <label className="text-xs font-bold">
          Pickup cost ₹
          <input type="number" value={pickupCost} onChange={(e) => setPickupCost(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-2 font-bold" />
        </label>
        <label className="text-xs font-bold">
          Ops cost ₹
          <input type="number" value={ops} onChange={(e) => setOps(e.target.value)} className="mt-1 w-full rounded-2xl border border-input bg-background p-2 font-bold" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn
          onClick={() => {
            updateSettings({
              commission_pct: Number(commission) || 0,
              pickup_cost: Number(pickupCost) || 0,
              ops_cost: Number(ops) || 0,
            });
            toast.success("Settings saved");
          }}
        >
          💾 Save
        </Btn>
        <Btn
          variant="outline"
          onClick={() => {
            resetDemoData();
            toast.success("Demo data reset");
          }}
        >
          ♻️ Reset demo data
        </Btn>
      </div>
    </Card>
  );
}
