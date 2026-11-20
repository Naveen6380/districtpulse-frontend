import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your official email")
    .email("Enter a valid email address")
    .max(255),
});

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DistrictPulse AI" },
      {
        name: "description",
        content: "Request password reset instructions for your DistrictPulse AI account.",
      },
      { property: "og:title", content: "Reset password — DistrictPulse AI" },
      {
        property: "og:description",
        content: "Request password reset instructions for your DistrictPulse AI account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: { email: string }) => {
    setError(null);
    try {
      const res = await authService.requestPasswordReset(email);
      setSent(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-md p-8">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
              <MailCheck className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">{sent}</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your official email and we'll send reset instructions.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-10"
                  placeholder="name@district.gov.in"
                  {...register("email")}
                />
                {formState.errors.email && (
                  <p className="text-xs text-destructive">{formState.errors.email.message}</p>
                )}
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="h-10 w-full" disabled={formState.isSubmitting}>
                {formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Send reset instructions
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
