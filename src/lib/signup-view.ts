import "server-only";
import { rootDomain, appUrl } from "./platform";

/** "{slug}.operra.app" or "app.operra.app/w/{slug}" — how a workspace address will look. */
export function addressTemplate() {
  const root = rootDomain();
  if (root) return `{slug}.${root}`;
  return `${appUrl().replace(/^https?:\/\//, "")}/w/{slug}`;
}
