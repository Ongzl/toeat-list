export default function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value == null) return <span className="shrink-0 text-xs text-muted">No ratings yet</span>;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-sm">
      <span className="text-star">★</span>
      <span className="font-semibold">{Number(value).toFixed(1)}</span>
      {count != null && <span className="text-xs text-muted">({count})</span>}
    </span>
  );
}
