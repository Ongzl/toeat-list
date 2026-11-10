import PlaceForm from "@/components/PlaceForm";
import { requireMember } from "@/lib/auth";
import { loadOptions } from "@/lib/places-query";
import { createPlace } from "../actions";

export default async function NewPlace() {
  const { supabase } = await requireMember();
  const { areas, cuisines } = await loadOptions(supabase);

  return (
    <main className="px-4 pt-4">
      <h1 className="mb-4 text-xl font-bold">Add a place</h1>
      <PlaceForm action={createPlace} areas={areas} cuisines={cuisines} cancelHref="/" />
    </main>
  );
}
