import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kilometrówka.app — ewidencja przejazdów i diety krajowe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f8fafc",
          padding: "64px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#f8fafc",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 22,
            }}
          >
            km
          </div>
          <div style={{ display: "flex", marginLeft: 16, fontSize: 32, fontWeight: 700 }}>
            Kilometrówka.app
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          <div style={{ display: "flex" }}>Ewidencja przejazdów</div>
          <div style={{ display: "flex" }}>bez Excela i bez konta</div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 24, color: "#94a3b8" }}>
          Stawki 2026 · diety krajowe · CSV / Excel · dane lokalnie
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 20, color: "#64748b" }}>
          MVP dla JDG i pracowników
        </div>
      </div>
    ),
    { ...size },
  );
}
