import type { PlaceListRow } from "@/lib/types";

export type Filters = {
  q?: string;
  area?: string;
  cuisine?: string;
  price?: string;
  tried?: "" | "notme" | "nobody" | "mine";
  sort?: "" | "rating" | "name"; // "" = newest first
};

/** The dropdown filters (everything except search and sort). */
export const FILTER_ONLY_KEYS = ["area", "cuisine", "price", "tried"] as const;
export const FILTER_KEYS = ["q", ...FILTER_ONLY_KEYS, "sort"] as const;

export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  return {
    q: get("q"),
    area: get("area"),
    cuisine: get("cuisine"),
    price: get("price"),
    tried: get("tried") as Filters["tried"],
    sort: get("sort") as Filters["sort"],
  };
}

export function toQuery(f: Filters) {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) if (f[k]) p.set(k, f[k] as string);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function applyFilters(rows: PlaceListRow[], f: Filters) {
  const q = f.q?.toLowerCase();
  const out = rows.filter((r) => {
    if (q && ![r.name, r.notes, r.area, r.cuisine].some((s) => s?.toLowerCase().includes(q))) return false;
    if (f.area && r.area !== f.area) return false;
    if (f.cuisine && r.cuisine !== f.cuisine) return false;
    if (f.price && String(r.price) !== f.price) return false;
    if (f.tried === "notme" && r.tried_by_me) return false;
    if (f.tried === "mine" && !r.tried_by_me) return false;
    if (f.tried === "nobody" && Number(r.tried_count) > 0) return false;
    return true;
  });

  const byNewest = (a: PlaceListRow, b: PlaceListRow) => b.created_at.localeCompare(a.created_at);
  if (f.sort === "rating") {
    out.sort((a, b) => (Number(b.avg_rating) || 0) - (Number(a.avg_rating) || 0) || byNewest(a, b));
  } else if (f.sort === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    out.sort(byNewest);
  }
  return out;
}

export const distinct = (rows: PlaceListRow[], key: "area" | "cuisine") =>
  [...new Set(rows.map((r) => r[key]).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));

export async function loadActivePlaces(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
) {
  const { data, error } = await supabase.from("place_list").select("*").is("deleted_at", null);
  if (error) throw error;
  return (data ?? []) as PlaceListRow[];
}
