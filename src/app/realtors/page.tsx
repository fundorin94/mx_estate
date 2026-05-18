import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verified real estate agents in Mexico",
  description:
    "Browse vetted bilingual realtors specializing in helping US and Canadian expats buy or rent property in Mexico.",
  alternates: { canonical: "/realtors" },
};

type SearchParams = { city?: string; lang?: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function RealtorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("realtors")
    .select(
      "id, name, photo_url, bio_en, languages, cities, expat_deals_count, is_verified",
    )
    .order("expat_deals_count", { ascending: false });

  if (searchParams.city) {
    query = query.contains("cities", [searchParams.city]);
  }
  if (searchParams.lang) {
    query = query.contains("languages", [searchParams.lang]);
  }

  const { data: realtors, error } = await query;

  // Collect unique city/language values for filter options
  const { data: allRealtors } = await supabase
    .from("realtors")
    .select("cities, languages");
  const allCities = new Set<string>();
  const allLanguages = new Set<string>();
  for (const r of allRealtors ?? []) {
    (r.cities ?? []).forEach((c: string) => allCities.add(c));
    (r.languages ?? []).forEach((l: string) => allLanguages.add(l));
  }

  return (
    <main className="px-6 sm:px-10 py-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Verified real estate agents</h1>
      <p className="text-gray-600 mb-6 max-w-2xl">
        Bilingual realtors with experience working with foreign buyers. Each
        agent is interviewed and verified by the ExpHaven team.
      </p>

      <form
        method="GET"
        className="grid gap-3 sm:grid-cols-3 mb-8 p-4 border border-gray-200 rounded"
      >
        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">City</span>
          <select
            name="city"
            defaultValue={searchParams.city ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All cities</option>
            {Array.from(allCities)
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Language</span>
          <select
            name="lang"
            defaultValue={searchParams.lang ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Any language</option>
            {Array.from(allLanguages)
              .sort()
              .map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-black text-white rounded px-4 py-1.5 text-sm hover:bg-gray-800"
          >
            Apply
          </button>
          <Link
            href="/realtors"
            className="text-sm text-gray-600 hover:underline px-2 py-1.5"
          >
            Reset
          </Link>
        </div>
      </form>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800 mb-6">
          <strong>Supabase error:</strong> {error.message}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">
        {realtors?.length ?? 0} agent{realtors?.length === 1 ? "" : "s"}
      </p>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {realtors?.map((r) => (
          <li key={r.id}>
            <Link
              href={`/realtors/${r.id}`}
              className="border border-gray-200 rounded p-5 flex gap-4 hover:border-gray-400 transition-colors h-full"
            >
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photo_url}
                  alt={r.name}
                  className="w-16 h-16 rounded-full object-cover bg-gray-100 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-medium text-gray-500 shrink-0">
                  {initials(r.name)}
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                <div className="font-semibold flex items-center gap-1">
                  {r.name}
                  {r.is_verified && (
                    <span
                      className="text-blue-600"
                      title="Verified by ExpHaven"
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {r.expat_deals_count}+ expat deals
                </div>
                {r.cities && r.cities.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {r.cities.join(" · ")}
                  </div>
                )}
                {r.languages && r.languages.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Speaks {r.languages.join(", ")}
                  </div>
                )}
                {r.bio_en && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {r.bio_en}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
