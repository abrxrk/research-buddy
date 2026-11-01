/** Public landing site (separate Next.js project in /landing). */
export const LANDING_URL = (process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001").replace(/\/$/, "");
