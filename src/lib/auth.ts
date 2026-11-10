import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

/** Signed-in user who is on the allow-list. Redirects otherwise. */
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("email", (user.email ?? "").toLowerCase())
    .maybeSingle<Member>();
  if (!member) redirect("/not-invited");

  return { supabase, user, member };
}

export async function requireAdmin() {
  const ctx = await requireMember();
  if (!ctx.member.is_admin) redirect("/");
  return ctx;
}
