import { ImageResponse } from "next/og";

import { LogoSvg } from "@/lib/logoSvg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home screen / Safari icon: logo on the site's dark background.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0b0d" }}>
        <LogoSvg size={132} />
      </div>
    ),
    size,
  );
}
