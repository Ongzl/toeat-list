import ConfirmButton from "@/components/ConfirmButton";
import SubmitButton from "@/components/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import type { Member } from "@/lib/types";
import { addMember, removeMember } from "./actions";

export default async function Members() {
  const { supabase, member: me } = await requireAdmin();
  const { data } = await supabase.from("members").select("*").order("added_at");
  const members = (data ?? []) as Member[];

  return (
    <main className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-xl font-bold">Members ({members.length})</h1>

      <ul className="card divide-y divide-line">
        {members.map((m) => (
          <li key={m.email} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="font-medium">
                {m.display_name} {m.is_admin && <span className="chip">admin</span>}
              </p>
              <p className="truncate text-xs text-muted">
                {m.email} · {m.user_id ? "signed in" : "hasn't signed in yet"}
              </p>
            </div>
            {m.email !== me.email && (
              <form action={removeMember.bind(null, m.email)}>
                <ConfirmButton message={`Remove ${m.display_name}? Their ratings stay.`} className="btn-danger text-sm">
                  Remove
                </ConfirmButton>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form action={addMember} className="card flex flex-col gap-3 p-4">
        <h2 className="font-semibold">Add someone</h2>
        <input name="display_name" required placeholder="Name (e.g. Aunty May)" className="input" />
        <input name="email" type="email" required placeholder="Their Google / email address" className="input" />
        <SubmitButton className="btn-primary">Add member</SubmitButton>
        <p className="text-xs text-muted">They can then sign in with Google or an emailed code using that address.</p>
      </form>
    </main>
  );
}
