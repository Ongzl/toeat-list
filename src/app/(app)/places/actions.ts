"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError, type ActionState } from "@/lib/action-state";
import { requireMember } from "@/lib/auth";
import { DIETARY_OPTIONS } from "@/lib/types";

const DELETED = "This place was deleted. Restore it from Deleted places first.";

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const url = (fd: FormData, key: string) => {
  const v = text(fd, key);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

/** A whole number in [min, max], or null. Rejects "", fractions like "4.5", and anything else. */
const wholeNumber = (fd: FormData, key: string, min: number, max: number) => {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

function placeFields(fd: FormData) {
  const dietary = fd
    .getAll("dietary")
    .filter((d): d is string => typeof d === "string" && (DIETARY_OPTIONS as readonly string[]).includes(d));
  return {
    name: text(fd, "name"),
    area: text(fd, "area"),
    address: text(fd, "address"),
    maps_url: url(fd, "maps_url"),
    cuisine: text(fd, "cuisine"),
    price: wholeNumber(fd, "price", 1, 3),
    dietary,
    recommended_by: text(fd, "recommended_by"),
    source_url: url(fd, "source_url"),
    notes: text(fd, "notes"),
  };
}

function refresh(placeId?: string) {
  revalidatePath("/");
  revalidatePath("/trash");
  if (placeId) revalidatePath(`/places/${placeId}`);
}

export async function createPlace(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireMember();
  const { name, ...rest } = placeFields(fd);
  if (!name) return { error: "Give the place a name." };

  const { data, error } = await supabase
    .from("places")
    .insert({ name, ...rest })
    .select("id")
    .single();
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect(`/places/${data.id}`);
}

export async function updatePlace(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireMember();
  const { name, ...rest } = placeFields(fd);
  if (!name) return { error: "Give the place a name." };

  const { data, error } = await supabase
    .from("places")
    .update({ name, ...rest })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: friendlyError(error) };
  if (!data.length) return { error: DELETED };
  refresh(id);
  redirect(`/places/${id}`);
}

export async function deletePlace(id: string): Promise<ActionState> {
  const { supabase } = await requireMember();
  // Only stamp places that aren't deleted yet, so a stale tab can't overwrite the original
  // deletion time (which orders Deleted places).
  const { data, error } = await supabase
    .from("places")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: friendlyError(error) };
  if (!data.length)
    return { error: "This place was already deleted. You can restore it from Deleted places." };
  refresh(id);
  redirect("/");
}

export async function restorePlace(id: string): Promise<ActionState> {
  const { supabase } = await requireMember();
  const { data, error } = await supabase
    .from("places")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id");
  if (error) return { error: friendlyError(error) };
  if (!data.length) return { error: "This place has already been restored." };
  refresh(id);
  return { ok: true };
}

export async function saveVisit(placeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, user } = await requireMember();
  const { data: place } = await supabase
    .from("places")
    .select("id")
    .eq("id", placeId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!place) return { error: DELETED };

  const { error } = await supabase.from("visits").upsert({
    place_id: placeId,
    user_id: user.id,
    rating: wholeNumber(fd, "rating", 1, 5),
    comment: text(fd, "comment"),
  });
  if (error) return { error: friendlyError(error) };
  refresh(placeId);
  return { ok: true };
}

export async function removeVisit(placeId: string): Promise<ActionState> {
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("visits").delete().eq("place_id", placeId).eq("user_id", user.id);
  if (error) return { error: friendlyError(error) };
  refresh(placeId);
  return { ok: true };
}
