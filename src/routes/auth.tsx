import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { getDB, setDB, signIn, useDB, useLang } from "@/lib/store";
import { LOCATIONS } from "@/lib/seed";
import { Btn, Card, LanguageSwitcher } from "@/components/ui-kit";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Register — E-Waste Setu" },
      {
        name: "description",
        content: "Sign in with your mobile number as a collector, recycler or admin on E-Waste Setu.",
      },
      { property: "og:title", content: "Login or Register — E-Waste Setu" },
      {
        property: "og:description",
        content: "Mobile + OTP sign in for collectors, recyclers and platform admins.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const lang = useLang();
  const navigate = useNavigate();
  const collectors = useDB((d) => d.collectors);
  const recyclers = useDB((d) => d.recyclers);

  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]!);
  const [facility, setFacility] = useState("");
  const [authNo, setAuthNo] = useState("");

  function finishLogin() {
    if (otp.trim().length < 4) {
      toast.error("Enter the 4-digit OTP (demo: 1234)");
      return;
    }
    if (role === "collector") {
      const c = collectors.find((x) => x.mobile.endsWith(mobile.slice(-6))) ?? collectors[0]!;
      signIn({ role: "collector", id: c.collector_id, name: c.nickname ?? c.collector_id });
      setDB((d) => {
        d.lang = c.preferred_language;
      });
      navigate({ to: "/collector" });
    } else if (role === "recycler") {
      const r = recyclers[0]!;
      signIn({ role: "recycler", id: r.recycler_id, name: r.recycler_name });
      navigate({ to: "/recycler" });
    } else {
      signIn({ role: "admin", id: "ADMIN-001", name: "Platform Admin" });
      navigate({ to: "/admin" });
    }
  }

  function registerCollector() {
    const db = getDB();
    const id = `COL-${String(db.collectors.length + 1).padStart(4, "0")}`;
    setDB((d) => {
      d.collectors.push({
        collector_id: id,
        nickname: name || undefined,
        mobile: mobile || "+910000000000",
        preferred_language: d.lang,
        general_location: location,
        created_at: new Date().toISOString(),
      });
    });
    signIn({ role: "collector", id, name: name || id });
    toast.success(`Collector ID ${id} created`);
    navigate({ to: "/collector" });
  }

  function registerRecycler() {
    const db = getDB();
    const id = `REC-${String(db.recyclers.length + 1).padStart(3, "0")}`;
    setDB((d) => {
      d.recyclers.push({
        recycler_id: id,
        recycler_name: name || "New Recycler",
        facility_name: facility || "New Facility",
        location,
        latitude: 16.85,
        longitude: 74.57,
        materials_accepted: ["PCB", "Copper Cable", "Battery"],
        authorization_number: authNo || "PENDING",
        authorization_status: "pending",
        contact: mobile,
        offered_rate: { PCB: 180, "Copper Cable": 500, Battery: 100 },
        pickup_available: true,
        service_area: [location],
        rating: 0,
        distance_km: 6,
        created_at: new Date().toISOString(),
      });
    });
    signIn({ role: "recycler", id, name: name || id });
    toast.success("Submitted for verification");
    navigate({ to: "/recycler" });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-deep">♻️ {t("appName", lang)}</span>
          <LanguageSwitcher compact />
        </div>

        {!role && (
          <Card>
            <h1 className="text-xl font-extrabold">{t("whoAreYou", lang)}</h1>
            <div className="mt-4 space-y-3">
              <Btn className="w-full text-lg" onClick={() => setRole("collector")}>
                👤 {t("collector", lang)}
              </Btn>
              <Btn variant="deep" className="w-full text-lg" onClick={() => setRole("recycler")}>
                ♻️ {t("recycler", lang)}
              </Btn>
              <Btn variant="outline" className="w-full" onClick={() => setRole("admin")}>
                🛠️ {t("admin", lang)}
              </Btn>
            </div>
          </Card>
        )}

        {role && (
          <Card>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold capitalize">
                {role === "collector" ? "👤" : role === "recycler" ? "♻️" : "🛠️"} {role}
              </h1>
              <button className="text-sm font-bold text-primary" onClick={() => setRole(null)}>
                ← {t("back", lang)}
              </button>
            </div>

            {role !== "admin" && (
              <div className="mt-3 flex rounded-2xl bg-secondary p-1">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                      mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {m === "login" ? t("login", lang) : t("register", lang)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <Field label={t("mobile", lang)}>
                <input
                  inputMode="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-lg"
                />
              </Field>

              {mode === "register" && role === "collector" && (
                <>
                  <Field label="Name / nickname (optional)">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    />
                  </Field>
                  <Field label="Operating area">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <p className="text-xs text-muted-foreground">
                    We only ask for the minimum. No email, no ID proof, no address.
                  </p>
                  <Btn className="w-full" onClick={registerCollector}>
                    ✅ {t("register", lang)}
                  </Btn>
                </>
              )}

              {mode === "register" && role === "recycler" && (
                <>
                  <Field label="Recycler name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    />
                  </Field>
                  <Field label="Facility name">
                    <input
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    />
                  </Field>
                  <Field label="Facility location">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Authorization / registration number">
                    <input
                      value={authNo}
                      onChange={(e) => setAuthNo(e.target.value)}
                      placeholder="MPCB/EW/2026/xxxx"
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3"
                    />
                  </Field>
                  <Field label="Authorization document">
                    <input type="file" accept="image/*,application/pdf" className="w-full text-sm" />
                  </Field>
                  <Btn className="w-full" onClick={registerRecycler}>
                    📤 Submit for verification
                  </Btn>
                </>
              )}

              {mode === "login" && (
                <>
                  {!otpSent ? (
                    <Btn
                      className="w-full"
                      onClick={() => {
                        setOtpSent(true);
                        toast.info("Demo OTP is 1234");
                      }}
                    >
                      📩 {t("sendOtp", lang)}
                    </Btn>
                  ) : (
                    <>
                      <Field label={`${t("otp", lang)} (demo 1234)`}>
                        <input
                          inputMode="numeric"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="1234"
                          className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-2xl tracking-[0.5em]"
                        />
                      </Field>
                      <Btn className="w-full" onClick={finishLogin}>
                        ✅ {t("verify", lang)}
                      </Btn>
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
