"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function addMember(fd: FormData) {
  const { supabase } = await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const displayName = String(fd.get("display_name") ?? "").trim();
  if (!email || !displayName) throw new Error("Email and name are required");
  const { error } = await supabase.from("members").insert({ email, display_name: displayName });
  if (error) throw error;
  revalidatePath("/members");
}

export async function removeMember(email: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("members").delete().eq("email", email);
  if (error) throw error;
  revalidatePath("/members");
}
