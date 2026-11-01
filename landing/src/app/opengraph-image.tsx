import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { LogoSvg } from "@/lib/logoSvg";

export const alt = "Research Buddy — read research papers like you wrote them";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
// Read at module level so the image is generated once at build time (static), not per request.
const [sans, sansBold, serif] = await Promise.all([
  font("Geist-Regular.ttf"),
  font("Geist-SemiBold.ttf"),
  font("InstrumentSerif-Italic.ttf"),
]);

const YELLOW = "#facc15";
const LINES = [92, 84, 96, 0, 88, 94, 70, 0, 90, 82];
const MARKED = new Set([1, 5, 8]);

/** Social preview card (WhatsApp, Slack, X, LinkedIn…), rendered at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b0b0d",
          backgroundImage: "radial-gradient(circle at 20% -10%, rgba(250,204,21,0.22), transparent 55%), radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
          backgroundSize: "100% 100%, 28px 28px",
          color: "#fafafa",
          fontFamily: "Geist",
          padding: "64px 72px",
        }}
      >
        {/* left: brand + headline */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <LogoSvg size={64} />
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>
              Research
              <span style={{ fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 40, marginLeft: 8 }}>Buddy</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05 }}>Read research papers</div>
            <div style={{ display: "flex", alignItems: "center", fontFamily: "Instrument Serif", fontSize: 80, lineHeight: 1.1 }}>
              like you
              <span style={{ background: YELLOW, color: "#111", borderRadius: 10, padding: "0 14px", marginLeft: 18 }}>wrote them.</span>
            </div>
            <div style={{ marginTop: 28, fontSize: 26, color: "#a1a1aa", maxWidth: 560, lineHeight: 1.4 }}>
              Overviews, findings, knowledge graphs and answers cited to the exact page.
            </div>
          </div>
        </div>

        {/* right: a highlighted paper page */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 330, marginLeft: 40 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 290,
              height: 380,
              background: "#f4f4f5",
              borderRadius: 14,
              padding: "30px 28px",
              transform: "rotate(4deg)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 90px rgba(250,204,21,0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", fontFamily: "Instrument Serif", fontSize: 26, color: "#111", textAlign: "center", lineHeight: 1.1 }}>
              Attention Is All You Need
            </div>
            <div style={{ display: "flex", width: 140, height: 5, borderRadius: 3, background: "#d4d4d8", margin: "12px auto 22px" }} />
            {LINES.map((w, i) =>
              w === 0 ? (
                <div key={i} style={{ display: "flex", height: 12 }} />
              ) : (
                <div key={i} style={{ display: "flex", position: "relative", width: `${w}%`, height: 7, marginBottom: 11 }}>
                  {MARKED.has(i) && (
                    <div style={{ display: "flex", position: "absolute", left: -4, right: -4, top: -4, bottom: -4, background: YELLOW, borderRadius: 3, opacity: 0.85 }} />
                  )}
                  <div style={{ display: "flex", width: "100%", height: 7, borderRadius: 4, background: "#d4d4d8", position: "relative" }} />
                </div>
              ),
            )}
            <div style={{ display: "flex", marginTop: "auto", alignSelf: "flex-start", background: "#18181b", color: "#fafafa", borderRadius: 8, padding: "6px 12px", fontSize: 16 }}>
              Key finding · p.8
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: sans, weight: 400, style: "normal" },
        { name: "Geist", data: sansBold, weight: 600, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
      ],
    },
  );
}
