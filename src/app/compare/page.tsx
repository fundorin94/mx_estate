import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { COMPARE_COOKIE, MAX_COMPARE, parseCompare } from "@/lib/compare";
import { removeFromCompare, clearCompare } from "@/app/actions/compare";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Compare properties",
  description:
    "Compare up to 3 properties side-by-side with highlights for best price, largest, and other advantages.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const ids = parseCompare(cookies().get(COMPARE_COOKIE)?.value);

  if (ids.length === 0) {
    return (
      <main className="p-6 sm:p-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Compare properties</h1>
        <p className="text-gray-600 mb-6">
          You haven&apos;t selected anything yet. Pick up to {MAX_COMPARE}{" "}
          properties from the listings to compare them side-by-side.
        </p>
        <Link
          href="/properties"
          className="inline-block bg-emerald-700 text-white rounded px-4 py-2 text-sm hover:bg-emerald-800"
        >
          Browse properties →
        </Link>
      </main>
    );
  }

  const supabase = createClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id, title, description_en, price_usd, type, neighborhood, bedrooms, bathrooms, area_sqm, images, city_id, is_restricted_zone, fideicomiso_required, realtor_id",
    )
    .in("id", ids);

  // Sort to match the order in the cookie
  const ordered = ids
    .map((id) => (properties ?? []).find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const cityIds = Array.from(new Set(ordered.map((p) => p.city_id)));
  const realtorIds = Array.from(
    new Set(ordered.map((p) => p.realtor_id).filter(Boolean) as string[]),
  );

  const [{ data: cities }, { data: realtors }] = await Promise.all([
    cityIds.length
      ? supabase.from("cities").select("id, name").in("id", cityIds)
      : Promise.resolve({ data: [] }),
    realtorIds.length
      ? supabase
          .from("realtors")
          .select("id, name, is_verified")
          .in("id", realtorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cityById = new Map<string, string>(
    (cities ?? []).map((c) => [c.id, c.name]),
  );
  const realtorById = new Map<
    string,
    { id: string; name: string; is_verified: boolean }
  >((realtors ?? []).map((r) => [r.id, r]));

  const highlights = computeHighlights(ordered);
  const pricePerSqm = computePricePerSqm(ordered);

  return (
    <main className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold">Compare</h1>
        <form action={clearCompare}>
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-black hover:underline"
          >
            Clear all
          </button>
        </form>
      </div>
      <p className="text-gray-600 mb-8">
        {ordered.length} of {MAX_COMPARE} properties selected.
      </p>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800 mb-6">
          <strong>Supabase error:</strong> {error.message}
        </div>
      )}

      <div
        className={`grid gap-6 ${
          ordered.length === 1
            ? "sm:max-w-md"
            : ordered.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {ordered.map((p) => {
          const cover = p.images?.[0];
          const cityName = cityById.get(p.city_id);
          const realtor = p.realtor_id ? realtorById.get(p.realtor_id) : null;

          return (
            <div
              key={p.id}
              className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white"
            >
              <div className="relative">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={p.title}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100" />
                )}
                <form
                  action={removeFromCompare.bind(null, p.id)}
                  className="absolute top-2 right-2"
                >
                  <button
                    type="submit"
                    className="w-7 h-7 rounded-full bg-white/95 text-gray-700 border border-gray-300 hover:bg-white text-sm shadow-sm"
                    aria-label="Remove from compare"
                  >
                    ×
                  </button>
                </form>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1">
                {highlights[p.id].length > 0 && (
                  <div className="-mx-4 -mt-4 mb-1 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                    <div className="text-xs uppercase tracking-wide text-emerald-800 mb-1.5 font-medium">
                      Highlights
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {highlights[p.id].map((h, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded bg-emerald-700 text-white"
                        >
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Row label="Price">
                  <span className="text-lg font-semibold">
                    ${p.price_usd.toLocaleString()}
                    {p.type === "rent" && (
                      <span className="text-sm font-normal text-gray-500">
                        {" "}
                        /mo
                      </span>
                    )}
                  </span>
                </Row>
                <Row label="Type">
                  {p.type === "sale" ? "For sale" : "For rent"}
                </Row>
                <Row label="Title">
                  <span className="font-medium">{p.title}</span>
                </Row>
                <Row label="Location">
                  {p.neighborhood}
                  {cityName && <> · {cityName}</>}
                </Row>
                <Row label="Bedrooms">{p.bedrooms ?? "—"}</Row>
                <Row label="Bathrooms">{p.bathrooms ?? "—"}</Row>
                <Row label="Area">
                  {p.area_sqm !== null ? `${p.area_sqm} m²` : "—"}
                </Row>
                <Row label="Price / m²">
                  {(() => {
                    const v = pricePerSqm[p.id];
                    return v !== undefined
                      ? `$${Math.round(v).toLocaleString()}`
                      : "—";
                  })()}
                </Row>
                <Row label="Restricted zone">
                  {p.is_restricted_zone ? "Yes" : "No"}
                </Row>
                <Row label="Fideicomiso required">
                  {p.fideicomiso_required ? "Yes" : "No"}
                </Row>
                <Row label="Realtor">
                  {realtor ? (
                    <Link
                      href={`/realtors/${realtor.id}`}
                      className="hover:underline"
                    >
                      {realtor.name}
                      {realtor.is_verified && (
                        <span className="text-blue-600 ml-1">✓</span>
                      )}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Row>
                {p.description_en && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 hover:text-black">
                      Description
                    </summary>
                    <p className="mt-2 text-gray-600 whitespace-pre-line">
                      {p.description_en}
                    </p>
                  </details>
                )}

                <Link
                  href={`/properties/${p.id}`}
                  className="mt-auto text-center bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
                >
                  View details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {ordered.length < MAX_COMPARE && (
        <div className="mt-8 text-sm text-gray-500">
          <Link href="/properties" className="hover:text-black hover:underline">
            + Add more properties to compare
          </Link>
        </div>
      )}
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col text-sm">
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-gray-800">{children}</span>
    </div>
  );
}

type ComparableProperty = {
  id: string;
  type: "sale" | "rent";
  price_usd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  is_restricted_zone: boolean;
  fideicomiso_required: boolean;
};

function uniqueWinner(
  ps: ComparableProperty[],
  getValue: (p: ComparableProperty) => number | null,
  better: (a: number, b: number) => boolean,
): string | null {
  const valid: { id: string; v: number }[] = [];
  for (const p of ps) {
    const v = getValue(p);
    if (typeof v === "number" && Number.isFinite(v)) valid.push({ id: p.id, v });
  }
  if (valid.length < 2) return null;
  let best = valid[0];
  for (const x of valid.slice(1)) if (better(x.v, best.v)) best = x;
  const tied = valid.filter((x) => x.v === best.v);
  return tied.length === 1 ? best.id : null;
}

function computePricePerSqm(
  ps: ComparableProperty[],
): Record<string, number | undefined> {
  const out: Record<string, number | undefined> = {};
  for (const p of ps) {
    if (typeof p.area_sqm === "number" && p.area_sqm > 0) {
      out[p.id] = p.price_usd / p.area_sqm;
    }
  }
  return out;
}

function computeHighlights(
  ps: ComparableProperty[],
): Record<string, string[]> {
  const result: Record<string, string[]> = Object.fromEntries(
    ps.map((p) => [p.id, [] as string[]]),
  );
  if (ps.length < 2) return result;

  const allSameType = ps.every((p) => p.type === ps[0].type);

  if (allSameType) {
    const w = uniqueWinner(ps, (p) => p.price_usd, (a, b) => a < b);
    if (w) result[w].push("Best price");
  }

  const wb = uniqueWinner(ps, (p) => p.bedrooms, (a, b) => a > b);
  if (wb) result[wb].push("Most bedrooms");

  const wbt = uniqueWinner(ps, (p) => p.bathrooms, (a, b) => a > b);
  if (wbt) result[wbt].push("Most bathrooms");

  const wa = uniqueWinner(ps, (p) => p.area_sqm, (a, b) => a > b);
  if (wa) result[wa].push("Largest");

  if (allSameType) {
    const ppsm = computePricePerSqm(ps);
    const wv = uniqueWinner(ps, (p) => ppsm[p.id] ?? null, (a, b) => a < b);
    if (wv) result[wv].push("Best value/m²");
  }

  const anyFideicomiso = ps.some((p) => p.fideicomiso_required);
  if (anyFideicomiso) {
    for (const p of ps) {
      if (!p.fideicomiso_required) result[p.id].push("No fideicomiso");
    }
  }

  const anyRestricted = ps.some((p) => p.is_restricted_zone);
  if (anyRestricted) {
    for (const p of ps) {
      if (!p.is_restricted_zone) result[p.id].push("Inland location");
    }
  }

  return result;
}
