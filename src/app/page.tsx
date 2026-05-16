import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: cities, error } = await supabase
    .from("cities")
    .select("id, name, state, slug, expat_community_size, avg_sale_usd")
    .order("name");

  return (
    <main className="min-h-screen p-8 sm:p-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">MX Estate</h1>
      <p className="text-gray-600 mb-8">
        Property search for expats in Mexico — MVP scaffold.
      </p>

      <h2 className="text-xl font-semibold mb-4">Launch cities</h2>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <strong>Supabase error:</strong> {error.message}
        </div>
      )}

      {!error && cities && cities.length === 0 && (
        <p className="text-gray-500">No cities yet — run the seed SQL.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {cities?.map((c) => (
          <li key={c.id} className="rounded border border-gray-200 p-4">
            <div className="font-medium">{c.name}</div>
            <div className="text-sm text-gray-500">{c.state}</div>
            <div className="text-xs text-gray-400 mt-2">
              expat community: {c.expat_community_size ?? "—"} · avg sale: $
              {c.avg_sale_usd?.toLocaleString() ?? "—"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
