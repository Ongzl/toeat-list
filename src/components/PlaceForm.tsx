import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { DIETARY_OPTIONS, type Place } from "@/lib/types";

type Props = {
  action: (fd: FormData) => Promise<void>;
  place?: Place;
  areas: string[];
  cuisines: string[];
  cancelHref: string;
};

/** Only the name is required: paste a link, type the name, done. */
export default function PlaceForm({ action, place, areas, cuisines, cancelHref }: Props) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="name">
          Name *
        </label>
        <input id="name" name="name" required defaultValue={place?.name} className="input" autoFocus={!place} />
      </div>

      <div>
        <label className="label" htmlFor="source_url">
          Link (TikTok, Instagram, review…)
        </label>
        <input
          id="source_url"
          name="source_url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          defaultValue={place?.source_url ?? ""}
          placeholder="https://"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="recommended_by">
          Recommended by
        </label>
        <input
          id="recommended_by"
          name="recommended_by"
          defaultValue={place?.recommended_by ?? ""}
          placeholder="e.g. Mum, TikTok, Google reviews"
          className="input"
        />
      </div>

      <details open={!!place} className="card p-4">
        <summary className="cursor-pointer text-sm font-medium">More details (optional)</summary>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="area">
                Area
              </label>
              <input id="area" name="area" list="areas" defaultValue={place?.area ?? ""} className="input" />
              <datalist id="areas">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="cuisine">
                Cuisine
              </label>
              <input
                id="cuisine"
                name="cuisine"
                list="cuisines"
                defaultValue={place?.cuisine ?? ""}
                className="input"
              />
              <datalist id="cuisines">
                {cuisines.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <fieldset>
            <legend className="label">Price</legend>
            <div className="grid grid-cols-4 gap-2">
              {[
                ["", "?"],
                ["1", "$"],
                ["2", "$$"],
                ["3", "$$$"],
              ].map(([v, l]) => (
                <label key={v} className="relative">
                  <input
                    type="radio"
                    name="price"
                    value={v}
                    defaultChecked={String(place?.price ?? "") === v}
                    className="peer sr-only"
                  />
                  <span className="btn-secondary w-full peer-checked:border-accent peer-checked:bg-accent-soft">
                    {l}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Dietary</legend>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((d) => (
                <label key={d}>
                  <input
                    type="checkbox"
                    name="dietary"
                    value={d}
                    defaultChecked={place?.dietary.includes(d)}
                    className="peer sr-only"
                  />
                  <span className="btn-secondary min-h-9 rounded-full text-sm peer-checked:border-accent peer-checked:bg-accent-soft">
                    {d}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="maps_url">
              Google Maps link
            </label>
            <input
              id="maps_url"
              name="maps_url"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              defaultValue={place?.maps_url ?? ""}
              placeholder="https://maps.app.goo.gl/…"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="address">
              Address
            </label>
            <input id="address" name="address" defaultValue={place?.address ?? ""} className="input" />
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={place?.notes ?? ""}
              placeholder="Get the laksa. Closed Mondays."
              className="input py-2"
            />
          </div>
        </div>
      </details>

      <div className="flex gap-2">
        <Link href={cancelHref} className="btn-secondary flex-1">
          Cancel
        </Link>
        <SubmitButton className="btn-primary flex-[2]">{place ? "Save changes" : "Add place"}</SubmitButton>
      </div>
    </form>
  );
}
