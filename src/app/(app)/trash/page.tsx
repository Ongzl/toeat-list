import ActionForm from "@/components/ActionForm";
import SubmitButton from "@/components/SubmitButton";
import { requireMember } from "@/lib/auth";
import type { Place } from "@/lib/types";
import { restorePlace } from "../places/actions";

export default async function Trash() {
  const { supabase } = await requireMember();
  const { data } = await supabase
    .from("places")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  const places = (data ?? []) as Place[];

  return (
    <main className="flex flex-col gap-3 px-4 pt-4">
      <h1 className="text-xl font-bold">Deleted places</h1>
      {places.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">Nothing deleted.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {places.map((p) => (
            <li key={p.id} className="card flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">Deleted {new Date(p.deleted_at!).toLocaleDateString()}</p>
              </div>
              <ActionForm action={restorePlace.bind(null, p.id)}>
                <SubmitButton className="btn-secondary text-sm" pendingText="…">
                  Restore
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
