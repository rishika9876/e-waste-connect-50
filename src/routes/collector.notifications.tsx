import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/i18n";
import { useDB, useLang } from "@/lib/store";
import { markNotificationsRead } from "@/lib/actions";
import { Btn, Card, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/collector/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — E-Waste Setu" },
      { name: "description", content: "Pickup, handover and payment updates for your e-waste lots." },
      { property: "og:title", content: "Notifications — E-Waste Setu" },
      { property: "og:description", content: "Stay updated on every step of your sale." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const lang = useLang();
  const items = useDB((d) => d.notifications.filter((n) => n.role === "collector"));

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">🔔 {t("notifications", lang)}</h1>
        <Btn variant="outline" onClick={() => markNotificationsRead("collector")}>
          ✓ {t("markRead", lang)}
        </Btn>
      </div>

      {items.length === 0 ? (
        <EmptyState text={t("noData", lang)} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={n.read ? "" : "border-primary"}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold">{n.title}</div>
                  <div className="text-sm text-muted-foreground">{n.body}</div>
                </div>
                <div className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(n.at).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
