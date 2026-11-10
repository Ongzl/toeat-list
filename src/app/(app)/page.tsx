import Link from "next/link";
import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import Stars from "@/components/Stars";
import { requireMember } from "@/lib/auth";
import { FILTER_ONLY_KEYS, readFilters, toQuery } from "@/lib/filters";
import { loadOptions, queryPlaces } from "@/lib/places-query";
import { priceLabel } from "@/lib/types";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireMember();
  const filters = readFilters(await searchParams);
  const [{ data, error }, options] = await Promise.all([
    queryPlaces(supabase, filters),
    loadOptions(supabase),
  ]);
  if (error) throw error;
  const places = data;
  const filtering = !!filters.q || FILTER_ONLY_KEYS.some((k) => filters[k]);

  return (
    // Bottom padding clears the floating "Add a place" button, including the iPhone home-indicator inset.
    <main className="flex flex-col gap-4 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <Suspense>
        <FilterBar areas={options.areas} cuisines={options.cuisines} />
      </Suspense>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {places.length} {places.length === 1 ? "place" : "places"}
        </span>
        {places.length > 0 && (
          <Link href={`/random${toQuery(filters)}`} prefetch={false} className="btn-secondary text-sm">
            🎲 Pick one for me
          </Link>
        )}
      </div>

      {places.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">
          {filtering ? "Nothing matches these filters." : "No places yet. Add the first one!"}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {places.map((p) => (
            <li key={p.id}>
              <Link href={`/places/${p.id}`} className="card block p-4 active:bg-accent-soft">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="leading-tight font-semibold">{p.name}</h2>
                  <Stars value={p.avg_rating} count={Number(p.rating_count)} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {[p.area, p.cuisine, priceLabel(p.price)].filter(Boolean).join(" · ") || "No details yet"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {p.tried_by_me ? (
                    <span className="chip">✓ You&apos;ve been</span>
                  ) : Number(p.tried_count) === 0 ? (
                    <span className="chip">✨ Nobody&apos;s tried</span>
                  ) : null}
                  {p.dietary.map((d) => (
                    <span key={d} className="chip">
                      {d}
                    </span>
                  ))}
                  {p.recommended_by && <span className="text-xs text-muted">via {p.recommended_by}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/places/new"
        className="btn-primary fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 px-6 shadow-lg"
      >
        + Add a place
      </Link>
    </main>
  );
}
