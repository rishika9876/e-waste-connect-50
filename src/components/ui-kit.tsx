import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { setLang, useLang, useOnline, useDB } from "@/lib/store";
import { speak } from "@/lib/speech";

export function BigTile({
  to,
  icon,
  label,
  tone = "primary",
  onClick,
}: {
  to?: string;
  icon: string;
  label: string;
  tone?: "primary" | "deep" | "warning" | "card";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "deep"
        ? "bg-deep text-deep-foreground"
        : tone === "warning"
          ? "bg-warning text-warning-foreground"
          : "bg-card text-card-foreground border border-border";
  const inner = (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl p-4 text-center shadow-sm active:scale-[0.98]",
        toneCls,
      )}
    >
      <span className="text-4xl leading-none">{icon}</span>
      <span className="text-base font-bold leading-tight">{label}</span>
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} className="w-full">
      {inner}
    </button>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-extrabold", tone)}>{value}</div>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "deep" | "warning" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const v = {
    primary: "bg-primary text-primary-foreground",
    deep: "bg-deep text-deep-foreground",
    warning: "bg-warning text-warning-foreground",
    outline: "border-2 border-primary text-primary bg-card",
    ghost: "bg-secondary text-secondary-foreground",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-50",
        v,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  status,
}: {
  status: "verified" | "pending" | "rejected" | "suspended";
}) {
  const map = {
    verified: ["🟢", "Authorized", "bg-success/15 text-success"],
    pending: ["🟡", "Pending Verification", "bg-warning/25 text-warning-foreground"],
    rejected: ["🔴", "Not Verified", "bg-destructive/15 text-destructive"],
    suspended: ["🔴", "Suspended", "bg-destructive/15 text-destructive"],
  }[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", map[2])}
    >
      {map[0]} {map[1]}
    </span>
  );
}

export function SyncDot({ state }: { state: "synced" | "pending" | "failed" }) {
  const map = { synced: "🟢 Synced", pending: "🟡 Waiting for sync", failed: "🔴 Sync failed" };
  return <span className="text-xs font-semibold text-muted-foreground">{map[state]}</span>;
}

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const lang = useLang();
  return (
    <button
      type="button"
      aria-label="Listen"
      onClick={() => speak(text, lang)}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-xl text-accent-foreground",
        className,
      )}
    >
      🎤
    </button>
  );
}

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const lang = useLang();
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded-full px-3 py-1.5 font-bold",
            compact ? "text-xs" : "text-sm",
            lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function ConnectionBar() {
  const online = useOnline();
  const lang = useLang();
  const pending = useDB((d) => d.queue.filter((q) => q.state === "pending").length);
  if (online && pending === 0) return null;
  return (
    <div
      className={cn(
        "px-4 py-2 text-center text-sm font-bold",
        online ? "bg-warning text-warning-foreground" : "bg-deep text-deep-foreground",
      )}
    >
      {online ? t("syncing", lang) : `📴 ${t("offline", lang)} — ${t("waitingSync", lang)}`}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
      <div className="text-4xl">📭</div>
      <p className="mt-2 font-semibold">{text}</p>
    </div>
  );
}

export function Sparkline({ points, color = "var(--primary)" }: { points: number[]; color?: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / span) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-16 w-full">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Bars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-28 shrink-0 truncate text-xs font-semibold">{d.label}</div>
          <div className="h-4 flex-1 rounded-full bg-secondary">
            <div
              className="h-4 rounded-full bg-primary"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-20 shrink-0 text-right text-xs font-bold tabular-nums">
            {Math.round(d.value).toLocaleString("en-IN")}
          </div>
        </div>
      ))}
    </div>
  );
}

export function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function tt(key: string, lang: Lang) {
  return t(key, lang);
}
