import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import Stars from "@/components/Stars";
import SubmitButton from "@/components/SubmitButton";
import { requireMember } from "@/lib/auth";
import { priceLabel, type Member, type PlaceListRow, type Visit } from "@/lib/types";
import { deletePlace, removeVisit, saveVisit } from "../actions";

export default async function PlaceDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ picked?: string }>;
}) {
  const { id } = await params;
  const { picked } = await searchParams;
  const { supabase, user } = await requireMember();

  const [{ data: place }, { data: visits }, { data: members }] = await Promise.all([
    supabase.from("place_list").select("*").eq("id", id).is("deleted_at", null).maybeSingle<PlaceListRow>(),
    supabase.from("visits").select("*").eq("place_id", id).order("visited_at", { ascending: false }),
    supabase.from("member_names").select("display_name, user_id"),
  ]);
  if (!place) notFound();

  const nameOf = new Map((members as Pick<Member, "display_name" | "user_id">[]).map((m) => [m.user_id, m.display_name]));
  const allVisits = (visits ?? []) as Visit[];
  const mine = allVisits.find((v) => v.user_id === user.id);
  const others = allVisits.filter((v) => v.user_id !== user.id);
  const mapsHref =
    place.maps_url ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      [place.name, place.address ?? place.area].filter(Boolean).join(" "),
    )}`;

  return (
    <main className="flex flex-col gap-4 px-4 pt-4">
      {picked && (
        <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-2 text-sm">
          <span>🎲 Tonight&apos;s pick!</span>
          <Link
            href={`/random${picked.startsWith("?") && picked.length > 1 ? picked : ""}`}
            prefetch={false}
            className="font-medium text-accent"
          >
            Pick again
          </Link>
        </div>
      )}

      <section className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold leading-tight">{place.name}</h1>
          <Stars value={place.avg_rating} count={Number(place.rating_count)} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {[place.area, place.cuisine, priceLabel(place.price)].filter(Boolean).join(" · ")}
        </p>
        {place.dietary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {place.dietary.map((d) => (
              <span key={d} className="chip">
                {d}
              </span>
            ))}
          </div>
        )}
        {place.address && <p className="mt-3 text-sm">📍 {place.address}</p>}
        {place.notes && <p className="mt-3 whitespace-pre-line text-sm">{place.notes}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            🗺️ Maps
          </a>
          {place.source_url ? (
            <a href={place.source_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              🔗 Source
            </a>
          ) : (
            <Link href={`/places/${id}/edit`} className="btn-secondary text-sm">
              ✏️ Edit
            </Link>
          )}
        </div>

        <p className="mt-3 text-xs text-muted">
          Added by {place.created_by_name ?? "someone"}
          {place.recommended_by && ` · recommended by ${place.recommended_by}`} ·{" "}
          {new Date(place.created_at).toLocaleDateString()}
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">{mine ? "Your visit" : "Been here?"}</h2>
        <ActionForm action={saveVisit.bind(null, id)} className="mt-3 flex flex-col gap-3">
          <fieldset>
            <legend className="sr-only">Your rating</legend>
            <div className="star-row flex flex-row-reverse justify-end gap-1">
              {[5, 4, 3, 2, 1].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    defaultChecked={mine?.rating === n}
                    className="peer sr-only"
                  />
                  <span className="star-pick flex h-11 w-11 items-center justify-center rounded-xl text-3xl text-line">
                    ★
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <input
            name="comment"
            defaultValue={mine?.comment ?? ""}
            placeholder="One-line verdict (optional)"
            className="input"
            maxLength={200}
          />
          <SubmitButton className="btn-primary">{mine ? "Update" : "✓ I've been here"}</SubmitButton>
        </ActionForm>
        {mine && (
          <ActionForm action={removeVisit.bind(null, id)} className="mt-2">
            <SubmitButton
              className="min-h-11 w-full text-sm text-muted"
              pendingText="Removing…"
              confirm="Remove your visit? Your rating and comment will be deleted."
            >
              Actually, I haven&apos;t been
            </SubmitButton>
          </ActionForm>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">The group says</h2>
        {others.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nobody else has been yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {others.map((v) => (
              <li key={v.user_id} className="py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{nameOf.get(v.user_id) ?? "Former member"}</span>
                  <span className="text-star">
                    {v.rating ? "★".repeat(v.rating) : <span className="text-xs text-muted">been, no rating</span>}
                  </span>
                </div>
                {v.comment && <p className="mt-0.5 text-sm text-muted">{v.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Link href={`/places/${id}/edit`} className="btn-secondary">
          ✏️ Edit
        </Link>
        <ActionForm action={deletePlace.bind(null, id)}>
          <SubmitButton
            className="btn-danger w-full"
            pendingText="Deleting…"
            confirm={`Delete "${place.name}"? You can restore it from Deleted places.`}
          >
            Delete
          </SubmitButton>
        </ActionForm>
      </div>
    </main>
  );
}
