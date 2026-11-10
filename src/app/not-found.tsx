import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        🍽️
      </div>
      <h1 className="text-xl font-bold">Nothing here</h1>
      <p className="text-sm text-muted">This place may have been deleted. Check Deleted places to restore it.</p>
      <Link href="/" className="btn-primary">
        Back to the list
      </Link>
    </main>
  );
}
