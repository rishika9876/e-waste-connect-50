import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { getDB, signIn, signOut, useDB, useLang, useOnline, useSession } from "@/lib/store";
import { Btn, Card, ConnectionBar, LanguageSwitcher } from "@/components/ui-kit";

export const Route = createFileRoute("/collector")({
  head: () => ({
    meta: [
      { title: "Collector App — E-Waste Setu" },
      {
        name: "description",
        content:
          "Scan e-waste, check prices, create lots, find authorized recyclers and track earnings.",
      },
      { property: "og:title", content: "Collector App — E-Waste Setu" },
      {
        property: "og:description",
        content: "Simple, picture-first e-waste selling for informal collectors.",
      },
    ],
  }),
  component: CollectorLayout,
});

const NAV = [
  { to: "/collector", icon: "🏠", key: "home", exact: true },
  { to: "/collector/prices", icon: "💰", key: "price" },
  { to: "/collector/lots", icon: "📦", key: "myLots" },
  { to: "/collector/earnings", icon: "💵", key: "earnings" },
  { to: "/collector/safety", icon: "⚠️", key: "safety" },
] as const;

function CollectorLayout() {
  const lang = useLang();
  const session = useSession();
  const online = useOnline();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useDB((d) => d.notifications.filter((n) => n.role === "collector" && !n.read).length);

  if (!session || session.role !== "collector") {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="mx-auto mt-16 max-w-sm text-center">
          <div className="text-5xl">👤</div>
          <h1 className="mt-2 text-xl font-extrabold">{t("collector", lang)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Please log in to continue.</p>
          <div className="mt-4 space-y-2">
            <Link to="/auth">
              <Btn className="w-full">🔐 {t("login", lang)}</Btn>
            </Link>
            <Btn
              variant="outline"
              className="w-full"
              onClick={() => {
                const c = getDB().collectors[0]!;
                signIn({ role: "collector", id: c.collector_id, name: c.nickname ?? c.collector_id });
              }}
            >
              ▶️ Continue as demo collector
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ConnectionBar />
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-deep px-4 py-3 text-deep-foreground">
        <div>
          <div className="text-xs opacity-80">{session.id}</div>
          <div className="text-lg font-extrabold">
            {t("namaste", lang)} {session.name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{online ? "🟢" : "📴"}</span>
          <Link to="/collector/notifications" className="relative text-2xl">
            🔔
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-warning px-1.5 text-[10px] font-black text-warning-foreground">
                {unread}
              </span>
            )}
          </Link>
          <button className="text-xs font-bold underline" onClick={signOut}>
            {t("logout", lang)}
          </button>
        </div>
      </header>
      <div className="flex justify-center py-2">
        <LanguageSwitcher compact />
      </div>

      <main className="mx-auto max-w-3xl px-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="text-2xl">{n.icon}</span>
                {t(n.key, lang)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
