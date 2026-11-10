import { notFound } from "next/navigation";
import PlaceForm from "@/components/PlaceForm";
import { requireMember } from "@/lib/auth";
import { distinct, loadActivePlaces } from "@/lib/filters";
import type { Place } from "@/lib/types";
import { updatePlace } from "../../actions";

export default async function EditPlace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireMember();
  const [{ data: place }, all] = await Promise.all([
    supabase.from("places").select("*").eq("id", id).is("deleted_at", null).maybeSingle<Place>(),
    loadActivePlaces(supabase),
  ]);
  if (!place) notFound();

  return (
    <main className="px-4 pt-4">
      <h1 className="mb-4 text-xl font-bold">Edit {place.name}</h1>
      <PlaceForm
        action={updatePlace.bind(null, id)}
        place={place}
        areas={distinct(all, "area")}
        cuisines={distinct(all, "cuisine")}
        cancelHref={`/places/${id}`}
      />
    </main>
  );
}
