import PlaceForm from "@/components/PlaceForm";
import { requireMember } from "@/lib/auth";
import { distinct, loadActivePlaces } from "@/lib/filters";
import { createPlace } from "../actions";

export default async function NewPlace() {
  const { supabase } = await requireMember();
  const all = await loadActivePlaces(supabase);

  return (
    <main className="px-4 pt-4">
      <h1 className="mb-4 text-xl font-bold">Add a place</h1>
      <PlaceForm
        action={createPlace}
        areas={distinct(all, "area")}
        cuisines={distinct(all, "cuisine")}
        cancelHref="/"
      />
    </main>
  );
}
