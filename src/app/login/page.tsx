"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <div className="text-5xl">🍜</div>
        <h1 className="mt-2 text-2xl font-bold">ToEat List</h1>
        <p className="text-sm text-muted">Our group&apos;s list of places worth eating at.</p>
      </div>

      <button onClick={google} className="btn-primary w-full">
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or email me a link <span className="h-px flex-1 bg-line" />
      </div>

      {status === "sent" ? (
        <p className="rounded-lg bg-accent-soft p-3 text-center text-sm">
          Check your inbox for a sign-in link.
        </p>
      ) : (
        <form onSubmit={magicLink} className="flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            autoComplete="email"
          />
          <button disabled={status === "sending"} className="btn-secondary w-full">
            {status === "sending" ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}

      {status === "error" && <p className="text-center text-sm text-danger">{error}</p>}
    </main>
  );
}
