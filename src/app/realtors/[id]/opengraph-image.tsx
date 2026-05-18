import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Realtor profile on ExpHaven";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function Image({ params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) {
    return fallback();
  }

  const supabase = createClient();
  const { data: realtor } = await supabase
    .from("realtors")
    .select("name, photo_url, cities, expat_deals_count, languages, is_verified")
    .eq("id", params.id)
    .maybeSingle();

  if (!realtor) return fallback();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "white",
          fontFamily: "sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#047857" }}>
          ExpHaven
        </div>

        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          {realtor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={realtor.photo_url}
              alt=""
              width={220}
              height={220}
              style={{
                width: 220,
                height: 220,
                borderRadius: 9999,
                objectFit: "cover",
                border: "4px solid #047857",
              }}
            />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 9999,
                background: "#d1fae5",
                color: "#065f46",
                fontSize: 88,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials(realtor.name)}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.05,
              }}
            >
              {realtor.name}
              {realtor.is_verified && (
                <span style={{ color: "#2563eb", marginLeft: 12 }}>✓</span>
              )}
            </div>
            <div style={{ fontSize: 28, color: "#4b5563" }}>
              {realtor.expat_deals_count}+ deals with foreign buyers
            </div>
            {realtor.cities && realtor.cities.length > 0 && (
              <div style={{ fontSize: 24, color: "#6b7280" }}>
                {realtor.cities.join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 22, color: "#6b7280" }}>
          Verified real estate agent on ExpHaven
        </div>
      </div>
    ),
    size,
  );
}

function fallback() {
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
