import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ExpHaven — Property search for US expats in Mexico";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>
          ExpHaven
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Find your home in Mexico.
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: 900,
            }}
          >
            Verified listings and trusted realtors for US and Canadian expats.
          </div>
        </div>

        <div style={{ fontSize: 24, opacity: 0.8 }}>
          Cabo · Puerto Vallarta · San Miguel de Allende
        </div>
      </div>
    ),
    size,
  );
}
