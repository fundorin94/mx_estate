import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initials(name: string) {
  return name
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function whatsappLink(phone: string | null, name: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    `Hi ${name}! I found you on MX Estate and would like to ask about properties in your area.`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export default async function RealtorPage({
  params,
}: {
  params: { id: string };
}) {
  if (!UUID_RE.test(params.id)) notFound();

  const supabase = createClient();

  const { data: realtor, error } = await supabase
    .from("realtors")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <strong>Supabase error:</strong> {error.message}
        </div>
      </main>
    );
  }

  if (!realtor) notFound();

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, title, price_usd, type, neighborhood, bedrooms, bathrooms, area_sqm, images, fideicomiso_required, city_id",
    )
    .eq("realtor_id", realtor.id)
    .order("created_at", { ascending: false });

  const cityIds = Array.from(
    new Set((properties ?? []).map((p) => p.city_id).filter(Boolean)),
  );

  const { data: cities } =
    cityIds.length > 0
      ? await supabase
          .from("cities")
          .select("id, name")
          .in("id", cityIds)
      : { data: [] };

  const cityById = new Map<string, string>(
    (cities ?? []).map((c) => [c.id, c.name]),
  );

  const wa = whatsappLink(realtor.phone, realtor.name);

  return (
    <main className="p-6 sm:p-10 max-w-5xl mx-auto">
      <nav className="text-sm text-gray-500 mb-4 flex gap-3">
        <Link href="/properties" className="hover:underline">
          ← All properties
        </Link>
      </nav>

      <header className="flex flex-col sm:flex-row gap-6 mb-8">
        {realtor.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={realtor.photo_url}
            alt={realtor.name}
            className="w-32 h-32 rounded-full object-cover bg-gray-100"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-medium text-gray-500">
            {initials(realtor.name)}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{realtor.name}</h1>
            {realtor.is_verified && (
              <span
                className="text-blue-600 text-2xl"
                title="Verified by MX Estate"
              >
                ✓
              </span>
            )}
          </div>

          <div className="text-gray-600 mb-2">
            {realtor.expat_deals_count}+ deals with foreign buyers
            {realtor.cities && realtor.cities.length > 0 && (
              <> · {realtor.cities.join(", ")}</>
            )}
          </div>

          {realtor.languages && realtor.languages.length > 0 && (
            <div className="text-sm text-gray-500 mb-4">
              Speaks: {realtor.languages.join(", ")}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white rounded px-4 py-2 text-sm hover:bg-green-700"
              >
                WhatsApp
              </a>
            )}
            {realtor.email && (
              <a
                href={`mailto:${realtor.email}`}
                className="border border-gray-300 rounded px-4 py-2 text-sm hover:bg-gray-50"
              >
                Email
              </a>
            )}
          </div>
        </div>
      </header>

      {realtor.bio_en && (
        <section className="mb-10 max-w-3xl">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-gray-700 whitespace-pre-line">{realtor.bio_en}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Listings by {realtor.name.split(" ")[0]} ({properties?.length ?? 0})
        </h2>

        {properties && properties.length === 0 && (
          <p className="text-gray-500">No active listings.</p>
        )}

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
  );
}
