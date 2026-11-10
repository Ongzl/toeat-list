import ActionForm from "@/components/ActionForm";
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
              <ActionForm action={removeMember.bind(null, m.email)}>
                <SubmitButton
                  className="btn-danger text-sm"
                  pendingText="Removing…"
                  confirm={`Remove ${m.display_name}? Their ratings stay.`}
                >
                  Remove
                </SubmitButton>
              </ActionForm>
            )}
          </li>
        ))}
      </ul>

      <ActionForm action={addMember} resetOnSuccess className="card flex flex-col gap-3 p-4">
        <h2 className="font-semibold">Add someone</h2>
        <label className="label" htmlFor="display_name">
          Name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          maxLength={60}
          placeholder="e.g. Aunty May"
          className="input"
        />
        <label className="label" htmlFor="member_email">
          Email
        </label>
        <input
          id="member_email"
          name="email"
          type="email"
          required
          maxLength={254}
          placeholder="Their Google / email address"
          className="input"
        />
        <SubmitButton className="btn-primary">Add member</SubmitButton>
        <p className="text-xs text-muted">They can then sign in with Google or an emailed code using that address.</p>
      </ActionForm>
    </main>
  );
}
