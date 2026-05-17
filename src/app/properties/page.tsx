import Link from "next/link";
import dynamicImport from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import type { PropertyType } from "@/lib/supabase/types";
import type { MapProperty } from "@/components/PropertyMap";

const PropertyMap = dynamicImport(
  () => import("@/components/PropertyMap").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Loading map…
      </div>
    ),
  },
);

export const dynamic = "force-dynamic";

type SearchParams = {
  city?: string;
  type?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
};

function parseIntOrNull(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseType(v: string | undefined): PropertyType | null {
  return v === "sale" || v === "rent" ? v : null;
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const filters = {
    citySlug: searchParams.city ?? null,
    type: parseType(searchParams.type),
    minPrice: parseIntOrNull(searchParams.min_price),
    maxPrice: parseIntOrNull(searchParams.max_price),
    minBedrooms: parseIntOrNull(searchParams.bedrooms),
  };

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug")
    .order("name");

  const selectedCityId =
    filters.citySlug && cities
      ? cities.find((c) => c.slug === filters.citySlug)?.id ?? null
      : null;

  let query = supabase
    .from("properties")
    .select(
      "id, title, price_usd, type, neighborhood, bedrooms, bathrooms, area_sqm, images, fideicomiso_required, city_id, lat, lng",
    )
    .order("created_at", { ascending: false });

  if (selectedCityId) query = query.eq("city_id", selectedCityId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.minPrice !== null) query = query.gte("price_usd", filters.minPrice);
  if (filters.maxPrice !== null) query = query.lte("price_usd", filters.maxPrice);
  if (filters.minBedrooms !== null)
    query = query.gte("bedrooms", filters.minBedrooms);

  const { data: properties, error } = await query;

  const cityById = new Map<string, string>(
    (cities ?? []).map((c) => [c.id, c.name]),
  );

  const mapProperties: MapProperty[] = (properties ?? [])
    .map((p) => {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      return {
        id: p.id,
        title: p.title,
        price_usd: p.price_usd,
        type: p.type,
        lat,
        lng,
        cover: p.images?.[0] ?? null,
        neighborhood: p.neighborhood,
        city: cityById.get(p.city_id) ?? null,
      };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  return (
    <main className="px-6 sm:px-10 py-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Properties</h1>
      <p className="text-gray-600 mb-6">
        Verified listings across our launch cities in Mexico.
      </p>

      <form
        method="GET"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-6 p-4 border border-gray-200 rounded"
      >
        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">City</span>
          <select
            name="city"
            defaultValue={filters.citySlug ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All cities</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Type</span>
          <select
            name="type"
            defaultValue={filters.type ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Sale + Rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Min price (USD)</span>
          <input
            type="number"
            name="min_price"
            min={0}
            step={1000}
            defaultValue={filters.minPrice ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Max price (USD)</span>
          <input
            type="number"
            name="max_price"
            min={0}
            step={1000}
            defaultValue={filters.maxPrice ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Bedrooms (min)</span>
          <input
            type="number"
            name="bedrooms"
            min={0}
            max={10}
            defaultValue={filters.minBedrooms ?? ""}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-black text-white rounded px-4 py-1.5 text-sm hover:bg-gray-800"
          >
            Apply
          </button>
          <Link
            href="/properties"
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
        {properties?.length ?? 0} result{properties?.length === 1 ? "" : "s"}
        {mapProperties.length < (properties?.length ?? 0) && (
          <> · {mapProperties.length} on map</>
        )}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* List */}
        <section>
          {properties && properties.length === 0 && !error && (
            <p className="text-gray-500">
              No properties match these filters. Try widening the search.
            </p>
          )}

          <ul className="grid gap-6 sm:grid-cols-2">
            {properties?.map((p) => {
              const cover = p.images?.[0];
              const cityName = cityById.get(p.city_id);
              return (
                <li key={p.id}>
                  <Link
                    href={`/properties/${p.id}`}
                    className="border border-gray-200 rounded overflow-hidden flex flex-col h-full hover:border-gray-400 transition-colors"
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={p.title}
                        className="w-full h-44 object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-full h-44 bg-gray-100" />
                    )}
                    <div className="p-4 flex flex-col gap-1 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-semibold">
                          ${p.price_usd.toLocaleString()}
                          {p.type === "rent" && (
                            <span className="text-xs font-normal text-gray-500">
                              {" "}
                              /mo
                            </span>
                          )}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {p.type === "sale" ? "Sale" : "Rent"}
                        </span>
                      </div>
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500">
                        {p.neighborhood}
                        {cityName && <> · {cityName}</>}
                      </div>
                      <div className="text-xs text-gray-600 flex gap-3 mt-1">
                        {p.bedrooms !== null && <span>🛏 {p.bedrooms}</span>}
                        {p.bathrooms !== null && <span>🛁 {p.bathrooms}</span>}
                        {p.area_sqm !== null && <span>📐 {p.area_sqm} m²</span>}
                      </div>
                      {p.fideicomiso_required && (
                        <div className="mt-auto pt-2">
                          <span className="inline-block text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Fideicomiso
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Map */}
        <aside className="lg:sticky lg:top-6 h-[70vh] lg:h-[calc(100vh-3rem)]">
          <PropertyMap properties={mapProperties} />
        </aside>
      </div>
    </main>
  );
}
