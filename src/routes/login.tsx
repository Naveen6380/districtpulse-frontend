import { useEffect, useState } from "react";
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
import "./login-portal.css";
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
  useEffect(() => {
    if (USE_MOCK_API) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    // Wake the API as soon as the sign-in page opens, before submitting credentials.
    void fetch(`${API_BASE_URL.replace(/\/$/, "")}/health`, {
      credentials: "omit", cache: "no-store", signal: controller.signal,
    }).then(response => response.body?.cancel()).catch(() => {}).finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
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
    <div className="portal-login">
      <header className="portal-brand">
        <div className="flex items-center gap-3">
          <span className="portal-brand-logo"><img src="/districtpulse-logo.svg" alt="" /></span>
          <div className="portal-brand-copy">
            <p className="portal-brand-title">DistrictPulse AI</p>
            <p className="portal-brand-subtitle">Collector's District Intelligence Platform</p>
          </div>
        </div>
      </header>
      <div className="portal-layout">
        <section className="portal-intro" aria-label="DistrictPulse introduction">
          <h1 className="sr-only">District Intelligence</h1>
          <span className="portal-rule" />
          <p>District Intelligence. Informed Decisions.</p>
        </section>
      <main className="portal-card">
        <div>
          <div className="portal-card-heading">
            <p className="portal-card-kicker">DISTRICTPULSE AI</p>
            <h2>District Intelligence<br />Portal</h2>
            <span className="portal-rule" />
            <p>Sign in to access your district workspace.</p>
          </div>

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
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
            <div className="portal-form-options">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("remember")}
                onCheckedChange={(c) => setValue("remember", c === true)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm font-medium hover:underline">Forgot password?</Link>
            </div>
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
              {formState.isSubmitting ? "Please wait…" : "Sign in to Dashboard"}
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
    </div>
  );
}
