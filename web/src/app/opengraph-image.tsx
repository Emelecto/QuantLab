import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG por defecto del sitio (Glass Terminal v3: fondo oscuro + acento).
 * Las páginas de blog generan la suya propia vía metadata dinámica.
 */
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
          padding: "80px",
          background: "#06090f",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#38bdf8", letterSpacing: 4 }}>
          QUANTLAB
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          Estrategias de trading
          <br />
          que de verdad funcionan
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#94a3b8", marginTop: 24 }}>
          Backtests walk-forward OOS · Torneos semanales · Comunidad
        </div>
      </div>
    ),
    { ...size },
  );
}
