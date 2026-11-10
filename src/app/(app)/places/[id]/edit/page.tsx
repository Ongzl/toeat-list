import { notFound } from "next/navigation";
import PlaceForm from "@/components/PlaceForm";
import { requireMember } from "@/lib/auth";
import { loadOptions } from "@/lib/places-query";
import { updatePlace } from "../../actions";

export default async function EditPlace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireMember();
  const [{ data: place }, { areas, cuisines }] = await Promise.all([
    supabase.from("places").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    loadOptions(supabase),
  ]);
  if (!place) notFound();

  return (
    <main className="px-4 pt-4">
      <h1 className="mb-4 text-xl font-bold">Edit {place.name}</h1>
      <PlaceForm
        action={updatePlace.bind(null, id)}
        place={place}
        areas={areas}
        cuisines={cuisines}
        cancelHref={`/places/${id}`}
      />
    </main>
  );
}
