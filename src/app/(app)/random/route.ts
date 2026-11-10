import { NextResponse } from "next/server";
import { readFilters } from "@/lib/filters";
import { queryPlaces } from "@/lib/places-query";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  const filters = readFilters(Object.fromEntries(url.searchParams));

  // Count the matches (fetching one row), then fetch just the randomly chosen one.
  const first = await queryPlaces(supabase, filters, { withCount: true }).range(0, 0);
  const total = first.count ?? 0;
  if (first.error || total === 0) return NextResponse.redirect(new URL(`/${url.search}`, url));

  const index = Math.floor(Math.random() * total);
  const pick =
    index === 0 ? first.data[0] : (await queryPlaces(supabase, filters).range(index, index)).data?.[0];
  if (!pick) return NextResponse.redirect(new URL(`/${url.search}`, url));

  const back = new URLSearchParams({ picked: url.search || "?" });
  return NextResponse.redirect(new URL(`/places/${pick.id}?${back}`, url));
}
