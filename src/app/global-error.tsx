"use client";

// Last-resort boundary for errors in the root layout itself.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Something went wrong</h1>
        <p>Check your connection and try again.</p>
        <button onClick={reset} style={{ minHeight: 44, padding: "0 16px" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
