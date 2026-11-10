"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { FILTER_ONLY_KEYS } from "@/lib/filters";

type Props = { areas: string[]; cuisines: string[] };

export default function FilterBar({ areas, cuisines }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function apply() {
    const fd = new FormData(formRef.current!);
    const p = new URLSearchParams();
    fd.forEach((v, k) => {
      if (typeof v === "string" && v.trim()) p.set(k, v.trim());
    });
    router.replace(p.size ? `/?${p}` : "/", { scroll: false });
  }

  // Cancel any pending debounced search, clear the dropdowns, then apply what's left in the form
  // (search text and sort) right away, so a late debounce can't undo the clear.
  function clearFilters() {
    clearTimeout(timer.current);
    for (const name of FILTER_ONLY_KEYS) {
      const el = formRef.current?.elements.namedItem(name);
      if (el instanceof HTMLSelectElement) el.value = "";
    }
    apply();
  }

  const activeCount = FILTER_ONLY_KEYS.filter((k) => sp.get(k)).length;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      onChange={(e) => {
        clearTimeout(timer.current);
        const isText = (e.target as HTMLElement).getAttribute("type") === "search";
        timer.current = setTimeout(apply, isText ? 300 : 0);
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={sp.get("q") ?? ""}
          placeholder="Search name, notes…"
          className="input"
        />
        <select name="sort" defaultValue={sp.get("sort") ?? ""} className="input w-auto" aria-label="Sort">
          <option value="">Newest</option>
          <option value="rating">Top rated</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      <details open={activeCount > 0}>
        <summary className="cursor-pointer py-1 text-sm text-muted">
          Filters{activeCount ? ` (${activeCount})` : ""}
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select name="area" defaultValue={sp.get("area") ?? ""} className="input" aria-label="Area">
            <option value="">Any area</option>
            {areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select name="cuisine" defaultValue={sp.get("cuisine") ?? ""} className="input" aria-label="Cuisine">
            <option value="">Any cuisine</option>
            {cuisines.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select name="price" defaultValue={sp.get("price") ?? ""} className="input" aria-label="Price">
            <option value="">Any price</option>
            <option value="1">$</option>
            <option value="2">$$</option>
            <option value="3">$$$</option>
          </select>
          <select name="tried" defaultValue={sp.get("tried") ?? ""} className="input" aria-label="Tried">
            <option value="">Tried or not</option>
            <option value="notme">I haven&apos;t tried</option>
            <option value="nobody">Nobody tried yet</option>
            <option value="mine">I&apos;ve tried</option>
          </select>
        </div>
        {activeCount > 0 && (
          <button type="button" className="mt-2 min-h-11 text-sm text-accent" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </details>
    </form>
  );
}
