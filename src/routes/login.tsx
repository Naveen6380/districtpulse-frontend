import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Newspaper,
  ShieldCheck,
  TriangleAlert,
  CloudRain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DemoBadge } from "@/components/dp/badges";
import { login } from "@/lib/auth";
import { getSession } from "@/services/auth/session";
import { API_BASE_URL, USE_MOCK_API } from "@/services/api/client";
import { waitForBackend } from "@/lib/backend-ready";
import { ROLE_LABEL } from "@/lib/format";
import type { Role } from "@/types";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your official email")
    .email("Enter a valid email address")
    .max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  remember: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: "collector", email: "collector@demo.districtpulse.in" },
  { role: "administrator", email: "admin@demo.districtpulse.in" },
  { role: "department_officer", email: "officer@demo.districtpulse.in" },
];

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: "/overview" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — DistrictPulse AI" },
      {
        name: "description",
        content: "Secure sign-in for the Collector's District Intelligence Platform.",
      },
      { property: "og:title", content: "Sign in — DistrictPulse AI" },
      {
        property: "og:description",
        content: "Secure sign-in for the Collector's District Intelligence Platform.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginPhase, setLoginPhase] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });
  const { register, handleSubmit, formState, setValue, watch } = form;

  const onSubmit = async (v: FormValues) => {
    setError(null);
    try {
      if (!USE_MOCK_API) {
        setLoginPhase("Checking server…");
        await waitForBackend(API_BASE_URL, () => setLoginPhase("Server starting… please wait (up to 4 minutes)."));
      }
      setLoginPhase("Signing in…");
      await login(v.email, v.password, v.remember);
      const target =
        search.redirect && search.redirect.startsWith("/") && !search.redirect.startsWith("//")
          ? search.redirect
          : "/overview";
      await navigate({ href: target, replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
    } finally {
      setLoginPhase(null);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <aside className="login-grid relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <img src="/districtpulse-logo.svg" alt="" className="size-10" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">
              DistrictPulse AI
            </p>
            <p className="text-xs text-sidebar-muted">Collector's District Intelligence Platform</p>
          </div>
        </div>
        <div className="max-w-lg">
          <p className="eyebrow text-sidebar-primary">District command center</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-sidebar-accent-foreground">
            One trusted picture of everything happening in your district.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-muted">
            News, incidents, weather, agriculture and department progress — consolidated,
            prioritised and traceable to the original source.
          </p>
          <ul className="mt-8 grid gap-3 text-sm">
            {[
              { icon: Newspaper, t: "Every AI summary links back to its source articles" },
              { icon: TriangleAlert, t: "Incidents ranked by severity with verification status" },
              { icon: CloudRain, t: "Weather warnings and field signals in one view" },
              { icon: ShieldCheck, t: "Role-based access for Collector, Admin and Departments" },
            ].map(({ icon: I, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <I className="size-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-sidebar-muted">
          For authorised government officials only. Activity may be logged by the district
          administration.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <img src="/districtpulse-logo.svg" alt="" className="size-8" />
            </span>
            <p className="text-base font-bold">DistrictPulse AI</p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your official district account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="h-10 pl-9"
                  placeholder="name@district.gov.in"
                  aria-invalid={!!formState.errors.email}
                  {...register("email")}
                />
              </div>
              {formState.errors.email && (
                <p className="text-xs text-destructive">{formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-10 px-9"
                  aria-invalid={!!formState.errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formState.errors.password && (
                <p className="text-xs text-destructive">{formState.errors.password.message}</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={watch("remember")}
                onCheckedChange={(c) => setValue("remember", c === true)}
              />
              Keep me signed in on this device
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-sev-critical-soft px-3 py-2 text-sm text-sev-critical"
              >
                {error}
              </p>
            )}
            <Button type="submit" className="h-10 w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {formState.isSubmitting ? "Please wait…" : "Sign in"}
            </Button>
            {loginPhase && <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{loginPhase}</p>}
          </form>

          {USE_MOCK_API && (
            <div className="mt-8 rounded-xl border border-dashed bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Demo accounts</p>
                <DemoBadge />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Pick a role to fill the email, then enter any password of 8+ characters.
              </p>
              <div className="grid gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.role}
                    type="button"
                    onClick={() => setValue("email", a.email, { shouldValidate: true })}
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-xs hover:border-ring hover:bg-accent"
                  >
                    <span className="font-semibold text-foreground">{ROLE_LABEL[a.role]}</span>
                    <span className="truncate pl-2 text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
