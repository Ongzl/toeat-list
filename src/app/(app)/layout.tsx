import Link from "next/link";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-lg font-bold">
          🍜 ToEat List
        </Link>
        <details className="relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl px-3 text-sm text-muted">
            {member.display_name} ▾
          </summary>
          <nav className="card absolute right-0 mt-1 flex w-44 flex-col overflow-hidden text-sm shadow-lg">
            <Link href="/trash" className="px-4 py-3 active:bg-accent-soft">
              🗑️ Deleted places
            </Link>
            {member.is_admin && (
              <Link href="/members" className="px-4 py-3 active:bg-accent-soft">
                👥 Members
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button className="w-full px-4 py-3 text-left active:bg-accent-soft">↩ Sign out</button>
            </form>
          </nav>
        </details>
      </header>
      {children}
    </div>
  );
}
