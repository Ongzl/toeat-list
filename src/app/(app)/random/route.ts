import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyFilters, loadActivePlaces, readFilters } from "@/lib/filters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  const filters = readFilters(Object.fromEntries(url.searchParams));
  const places = applyFilters(await loadActivePlaces(supabase), filters);
  if (places.length === 0) return NextResponse.redirect(new URL(`/${url.search}`, url));
  const pick = places[Math.floor(Math.random() * places.length)];
  const back = new URLSearchParams({ picked: url.search || "?" });
  return NextResponse.redirect(new URL(`/places/${pick.id}?${back}`, url));
}
