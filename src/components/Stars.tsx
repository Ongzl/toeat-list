export default function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value == null) return <span className="shrink-0 text-xs text-muted">No ratings yet</span>;
  const avg = Number(value).toFixed(1);
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-sm">
      <span aria-hidden className="text-star">
        ★
      </span>
      <span aria-hidden className="font-semibold">
        {avg}
      </span>
      {count != null && (
        <span aria-hidden className="text-xs text-muted">
          ({count})
        </span>
      )}
      <span className="sr-only">
        Rated {avg} out of 5{count != null && ` from ${count} ${count === 1 ? "rating" : "ratings"}`}
      </span>
    </span>
  );
}
