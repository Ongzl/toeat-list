// Pure helpers for the list filters (safe to import from client components and unit tests).

export const TRIED_VALUES = ["notme", "nobody", "mine"] as const;
export const SORT_VALUES = ["rating", "name"] as const; // absent = newest first
export const PRICE_VALUES = ["1", "2", "3"] as const;

export type Filters = {
  q: string;
  area: string;
  cuisine: string;
  price: "" | (typeof PRICE_VALUES)[number];
  tried: "" | (typeof TRIED_VALUES)[number];
  sort: "" | (typeof SORT_VALUES)[number];
};

/** The dropdown filters (everything except search and sort). */
export const FILTER_ONLY_KEYS = ["area", "cuisine", "price", "tried"] as const;
export const FILTER_KEYS = ["q", ...FILTER_ONLY_KEYS, "sort"] as const;

const MAX_TEXT = 80;

function oneOf<T extends string>(allowed: readonly T[], value: string): "" | T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

/** Parse untrusted query-string values; anything unexpected becomes "" (no filter). */
export function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => {
    const v = sp[k];
    return ((Array.isArray(v) ? v[0] : v) ?? "").trim().slice(0, MAX_TEXT);
  };
  return {
    q: get("q"),
    area: get("area"),
    cuisine: get("cuisine"),
    price: oneOf(PRICE_VALUES, get("price")),
    tried: oneOf(TRIED_VALUES, get("tried")),
    sort: oneOf(SORT_VALUES, get("sort")),
  };
}

export function toQuery(f: Partial<Filters>) {
  const p = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Make free text safe to embed in a PostgREST `or=(…ilike…)` filter: drop the characters that
 * have meaning there (, ( ) " \ : and the * / % wildcards) and collapse whitespace.
 */
export function searchPattern(q: string): string | null {
  const cleaned = q.replace(/[,()"\\:*%]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? `*${cleaned}*` : null;
}
