import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#111827",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          fontSize: 48,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#d1d5db" }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
