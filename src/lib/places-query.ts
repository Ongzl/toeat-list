import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { searchPattern, type Filters } from "@/lib/filters";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Active places matching the filters, filtered and sorted in the database.
 * Pass `withCount` to also get the total number of matches (e.g. to pick one at random with .range()).
 */
export function queryPlaces(supabase: Client, f: Filters, { withCount = false } = {}) {
  let q = supabase
    .from("place_list")
    .select("*", withCount ? { count: "exact" } : undefined)
    .is("deleted_at", null);

  const pattern = searchPattern(f.q);
  if (pattern) {
    q = q.or(["name", "notes", "area", "cuisine"].map((c) => `${c}.ilike.${pattern}`).join(","));
  }
  if (f.area) q = q.eq("area", f.area);
  if (f.cuisine) q = q.eq("cuisine", f.cuisine);
  if (f.price) q = q.eq("price", Number(f.price));
  if (f.tried === "notme") q = q.eq("tried_by_me", false);
  if (f.tried === "mine") q = q.eq("tried_by_me", true);
  if (f.tried === "nobody") q = q.eq("tried_count", 0);

  if (f.sort === "rating") q = q.order("avg_rating", { ascending: false, nullsFirst: false });
  if (f.sort === "name") q = q.order("name", { ascending: true });
  return q.order("created_at", { ascending: false });
}

/** Distinct areas and cuisines, for dropdowns and form suggestions. */
export async function loadOptions(supabase: Client) {
  const { data, error } = await supabase.from("place_options").select("kind, value").order("value");
  if (error) throw error;
  return {
    areas: data.filter((o) => o.kind === "area").map((o) => o.value),
    cuisines: data.filter((o) => o.kind === "cuisine").map((o) => o.value),
  };
}
