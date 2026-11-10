"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  auth: "That sign-in didn't work. Try again, or use the 6-digit code option below.",
};

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(ERRORS[params.get("error") ?? ""] ?? "");

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  // A code (not a link) works whichever browser or mail app opens the email, including when the
  // app is installed to the home screen and keeps its own cookies.
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      return setError("That code didn't work. Check it, or send a new one.");
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          🍜
        </div>
        <h1 className="mt-2 text-2xl font-bold">ToEat List</h1>
        <p className="text-sm text-muted">Our group&apos;s list of places worth eating at.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-danger p-3 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <button onClick={google} className="btn-primary w-full">
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or get a code by email <span className="h-px flex-1 bg-line" />
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-2">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            autoComplete="email"
          />
          <button disabled={busy} className="btn-secondary w-full">
            {busy ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-2">
          <label htmlFor="code" className="text-center text-sm">
            We sent a 6-digit code to <strong>{email}</strong>
          </label>
          <input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            placeholder="123456"
            className="input text-center text-2xl tracking-[0.4em]"
            autoFocus
          />
          <button disabled={busy || code.length !== 6} className="btn-primary w-full">
            {busy ? "Checking…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="min-h-11 text-sm text-muted"
          >
            Use a different email
          </button>
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
