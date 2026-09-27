import { notFound } from "next/navigation";

/** Any unknown path renders the localized 404 (./not-found.tsx) inside the site's layout. */
export default function Missing() {
  notFound();
}
