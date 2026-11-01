export const GITHUB_URL = "https://github.com/abrxrk/research-buddy";
/** README "Demo" section, where the walkthrough video lives. */
export const DEMO_URL = `${GITHUB_URL}#demo`;
/** The Research Buddy web app (separate Next.js project in /frontend). */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
