import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireMember();

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background/90 px-4 py-3 backdrop-blur">
        <Link href="/" className="rounded-lg text-lg font-bold focus-visible:outline-2 focus-visible:outline-accent">
          🍜 ToEat List
        </Link>
        <AccountMenu name={member.display_name} isAdmin={member.is_admin} />
      </header>
      {children}
    </div>
  );
}
