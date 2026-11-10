import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Signed-in user who is on the allow-list. Redirects otherwise. */
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Keyed on the verified auth user, not the (unverified) email claim: the DB only links a member row
  // to an account once its email is confirmed.
  const { data: member } = await supabase.from("members").select("*").eq("user_id", user.id).maybeSingle();
  if (!member || !user.email_confirmed_at) redirect("/not-invited");

  return { supabase, user, member };
}

export async function requireAdmin() {
  const ctx = await requireMember();
  if (!ctx.member.is_admin) redirect("/");
  return ctx;
}
