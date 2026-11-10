"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { DIETARY_OPTIONS } from "@/lib/types";

const text = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const url = (fd: FormData, key: string) => {
  const v = text(fd, key);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

function placeFields(fd: FormData) {
  const name = text(fd, "name");
  if (!name) throw new Error("Name is required");
  const price = Number(fd.get("price"));
  const dietary = fd
    .getAll("dietary")
    .filter((d): d is string => typeof d === "string" && (DIETARY_OPTIONS as readonly string[]).includes(d));
  return {
    name,
    area: text(fd, "area"),
    address: text(fd, "address"),
    maps_url: url(fd, "maps_url"),
    cuisine: text(fd, "cuisine"),
    price: price >= 1 && price <= 3 ? price : null,
    dietary,
    recommended_by: text(fd, "recommended_by"),
    source_url: url(fd, "source_url"),
    notes: text(fd, "notes"),
  };
}

export async function createPlace(fd: FormData) {
  const { supabase, user } = await requireMember();
  const { data, error } = await supabase
    .from("places")
    .insert({ ...placeFields(fd), created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/");
  redirect(`/places/${data.id}`);
}

export async function updatePlace(id: string, fd: FormData) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("places").update(placeFields(fd)).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  redirect(`/places/${id}`);
}

export async function deletePlace(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("places").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  redirect("/");
}

export async function restorePlace(id: string) {
  const { supabase } = await requireMember();
  const { error } = await supabase.from("places").update({ deleted_at: null }).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/trash");
}

export async function saveVisit(placeId: string, fd: FormData) {
  const { supabase, user } = await requireMember();
  const rating = Number(fd.get("rating"));
  const { error } = await supabase.from("visits").upsert({
    place_id: placeId,
    user_id: user.id,
    rating: rating >= 1 && rating <= 5 ? rating : null,
    comment: text(fd, "comment"),
  });
  if (error) throw error;
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/");
}

export async function removeVisit(placeId: string) {
  const { supabase, user } = await requireMember();
  const { error } = await supabase.from("visits").delete().eq("place_id", placeId).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath(`/places/${placeId}`);
  revalidatePath("/");
}
