"use server";

import { revalidatePath } from "next/cache";
import { friendlyError, type ActionState } from "@/lib/action-state";
import { requireAdmin } from "@/lib/auth";

// One @, something on both sides, a dot in the domain, no spaces. The browser's type="email" check
// isn't enough on its own: the action can be called directly.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(fd.get("display_name") ?? "").trim();
  if (!email || !displayName) return { error: "Enter both a name and an email." };
  if (!EMAIL.test(email)) return { error: `"${email}" doesn't look like an email address.` };

  const { error } = await supabase.from("members").insert({ email, display_name: displayName });
  if (error) return { error: friendlyError(error, `${email} is already on the list.`) };
  revalidatePath("/members");
  return { ok: true };
}

export async function removeMember(email: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("members").delete().eq("email", email);
  if (error) return { error: friendlyError(error) };
  revalidatePath("/members");
  return { ok: true };
}
