"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const item =
  "block w-full px-4 py-3 text-left hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none active:bg-accent-soft";

/** Account dropdown that closes on navigation, outside tap and Escape. */
export default function AccountMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close whenever the route changes (the layout, and so this menu, persists across navigations).
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
      >
        {name} <span aria-hidden>&nbsp;▾</span>
      </button>
      {open && (
        <nav
          id="account-menu"
          aria-label="Account"
          className="card absolute right-0 mt-1 flex w-48 flex-col overflow-hidden text-sm shadow-lg"
        >
          <Link href="/trash" className={item}>
            🗑️ Deleted places
          </Link>
          {isAdmin && (
            <Link href="/members" className={item}>
              👥 Members
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className={item}>↩ Sign out</button>
          </form>
        </nav>
      )}
    </div>
  );
}
