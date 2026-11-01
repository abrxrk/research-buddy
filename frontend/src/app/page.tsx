import { redirect } from "next/navigation";

// The marketing site lives in /landing; the app starts at the dashboard (which sends logged-out users to /auth).
export default function Home() {
  redirect("/dashboard");
}
