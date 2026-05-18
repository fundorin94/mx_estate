import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Property listing on ExpHaven";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatPrice(price: number, type: "sale" | "rent") {
  if (type === "rent") return `$${price.toLocaleString()}/mo`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1000) return `$${(price / 1000).toFixed(0)}k`;
  return `$${price}`;
}

export default async function Image({ params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) {
    return fallbackImage();
  }

  const supabase = createClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      "title, price_usd, type, neighborhood, bedrooms, bathrooms, area_sqm, images, city_id",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!property) return fallbackImage();

  const { data: city } = await supabase
    .from("cities")
    .select("name")
    .eq("id", property.city_id)
    .maybeSingle();

  const cover = property.images?.[0];
  const location = [property.neighborhood, city?.name].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 600,
            height: "100%",
            background: cover ? `url(${cover})` : "#e5e7eb",
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 56px",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: "#047857" }}>
            ExpHaven
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 22,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {property.type === "sale" ? "For sale" : "For rent"}
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1,
              }}
            >
              {formatPrice(property.price_usd, property.type)}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: "#1f2937",
                marginTop: 8,
                lineHeight: 1.2,
              }}
            >
              {property.title}
            </div>
            <div style={{ fontSize: 22, color: "#6b7280" }}>{location}</div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 32,
              fontSize: 22,
              color: "#374151",
            }}
          >
            {property.bedrooms !== null && (
              <span>🛏 {property.bedrooms} beds</span>
            )}
            {property.bathrooms !== null && (
              <span>🛁 {property.bathrooms} baths</span>
            )}
            {property.area_sqm !== null && <span>📐 {property.area_sqm} m²</span>}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#047857",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        ExpHaven
      </div>
    ),
    size,
  );
}
