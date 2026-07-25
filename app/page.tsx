/* P1-01 placeholder. The real home page is P3-01 and is Sanity-driven.
   Deliberately carries no copy, no statistics and no palette — content comes
   from the client (P0-04) and colour comes from P1-02. */

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">
        JS Workplace Wellness
      </h1>
      <p className="mt-4 text-lg leading-relaxed">
        Foundation scaffold. Design tokens land in P1-02, the layout shell in
        P1-03.
      </p>
    </main>
  );
}
