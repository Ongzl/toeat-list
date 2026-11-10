"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center gap-4 px-4 pt-16 text-center">
      <div className="text-5xl" aria-hidden>
        😵
      </div>
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted">Check your connection and try again.</p>
      <div className="flex gap-2">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to the list
        </Link>
      </div>
    </main>
  );
}
