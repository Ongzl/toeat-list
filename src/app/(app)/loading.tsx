export default function Loading() {
  return (
    <main className="flex flex-col gap-3 px-4 pt-4" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-24 animate-pulse" />
      ))}
    </main>
  );
}
