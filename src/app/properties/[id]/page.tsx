import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function whatsappLink(phone: string | null, propertyTitle: string) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(
    `Hi! I'm interested in "${propertyTitle}" listed on MX Estate. Could you share more details?`,
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isUuid(params.id)) notFound();

  const supabase = createClient();

  const { data: property, error } = await supabase
    .from("properties")
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

  if (!property) notFound();

  const [{ data: city }, { data: realtor }] = await Promise.all([
    supabase
      .from("cities")
      .select("id, name, state, slug, description_en")
      .eq("id", property.city_id)
      .maybeSingle(),
    property.realtor_id
      ? supabase
          .from("realtors")
          .select(
            "id, name, photo_url, bio_en, languages, phone, email, expat_deals_count, is_verified",
          )
          .eq("id", property.realtor_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const wa = whatsappLink(realtor?.phone ?? null, property.title);
  const images: string[] = property.images ?? [];
  const cover = images[0];
  const restImages = images.slice(1, 5);

  return (
    <main className="min-h-screen p-6 sm:p-10 max-w-5xl mx-auto">
      <nav className="text-sm text-gray-500 mb-4 flex gap-3">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span>/</span>
        <Link href="/properties" className="hover:underline">
          Properties
        </Link>
      </nav>

      {/* Gallery */}
      <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2 mb-8 rounded overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={property.title}
            className="w-full h-64 sm:h-full sm:col-span-2 sm:row-span-2 object-cover bg-gray-100"
          />
        ) : (
          <div className="w-full h-64 sm:col-span-2 sm:row-span-2 bg-gray-100" />
        )}
        {Array.from({ length: 4 }).map((_, i) => {
          const src = restImages[i];
          return src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="w-full h-32 object-cover bg-gray-100"
            />
          ) : (
            <div key={i} className="w-full h-32 bg-gray-100" />
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold">
              ${property.price_usd.toLocaleString()}
              {property.type === "rent" && (
                <span className="text-lg font-normal text-gray-500"> /mo</span>
              )}
            </span>
            <span className="text-sm uppercase tracking-wide text-gray-500">
              {property.type === "sale" ? "For sale" : "For rent"}
            </span>
          </div>

          <h1 className="text-2xl font-semibold mb-1">{property.title}</h1>
          <div className="text-gray-600 mb-6">
            {property.neighborhood}
            {city && (
              <>
                {" · "}
                <Link
                  href={`/cities/${city.slug}`}
                  className="hover:underline"
                >
                  {city.name}
                </Link>
                {", "}
                {city.state}
              </>
            )}
          </div>

          <div className="flex gap-6 mb-8 text-gray-700">
            {property.bedrooms !== null && (
              <span>
                🛏 <strong>{property.bedrooms}</strong> beds
              </span>
            )}
            {property.bathrooms !== null && (
              <span>
                🛁 <strong>{property.bathrooms}</strong> baths
              </span>
            )}
            {property.area_sqm !== null && (
              <span>
                📐 <strong>{property.area_sqm}</strong> m²
              </span>
            )}
          </div>

          {property.description_en && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-2">About this property</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {property.description_en}
              </p>
            </section>
          )}

          {(property.fideicomiso_required ||
            property.is_restricted_zone ||
            property.legal_notes) && (
            <section className="mb-8 rounded border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-lg font-semibold mb-2 text-amber-900">
                Legal notes for foreign buyers
              </h2>
              <ul className="text-sm text-amber-900 space-y-1 mb-3">
                {property.is_restricted_zone && (
                  <li>
                    📍 Located within Mexico&apos;s restricted zone (50km from
                    coast or 100km from border).
                  </li>
                )}
                {property.fideicomiso_required && (
                  <li>
                    🏛 Fideicomiso (bank trust) required for foreign ownership.
                    Setup typically ~$2.5k + ~$700/yr.
                  </li>
                )}
              </ul>
              {property.legal_notes && (
                <p className="text-sm text-amber-900 whitespace-pre-line">
                  {property.legal_notes}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Realtor sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6 border border-gray-200 rounded p-5">
            <h2 className="text-lg font-semibold mb-4">Listing agent</h2>

            {realtor ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {realtor.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={realtor.photo_url}
                      alt={realtor.name}
                      className="w-14 h-14 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                      {realtor.name
                        .split(" ")
                        .map((s: string) => s[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/realtors/${realtor.id}`}
                      className="font-medium flex items-center gap-1 hover:underline"
                    >
                      {realtor.name}
                      {realtor.is_verified && (
                        <span
                          className="text-blue-600"
                          title="Verified by MX Estate"
                        >
                          ✓
                        </span>
                      )}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {realtor.expat_deals_count}+ expat deals ·{" "}
                      {realtor.languages?.join(", ")}
                    </div>
                  </div>
                </div>

                {realtor.bio_en && (
                  <p className="text-sm text-gray-600 mb-4">{realtor.bio_en}</p>
                )}

                <div className="flex flex-col gap-2">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white rounded px-4 py-2 text-sm text-center hover:bg-green-700"
                    >
                      WhatsApp
                    </a>
                  )}
                  <LeadForm
                    propertyId={property.id}
                    realtorId={realtor?.id ?? null}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No agent assigned to this listing yet.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
