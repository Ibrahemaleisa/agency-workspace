/**
 * Where each tutorial step points in the real UI: a [data-tour] anchor and the page it lives on.
 * Copy lives in i18n-saas (tour.flows); both lists are the same length per flow.
 * Steps only reference screens the role can actually open.
 */
export type TourFlow = "admin" | "account" | "production" | "client";
export type TourTarget = { anchor?: string; path?: string };

export const TOUR_TARGETS: Record<TourFlow, TourTarget[]> = {
  admin: [
    {},
    { anchor: "nav-dashboard", path: "/" },
    { anchor: "nav-clients", path: "/clients" },
    { anchor: "nav-projects", path: "/projects" },
    { anchor: "nav-templates", path: "/templates" },
    { anchor: "nav-tasks", path: "/tasks" },
    { anchor: "nav-teamChat", path: "/chat" },
    { anchor: "nav-approvals", path: "/approvals" },
    { anchor: "invite-card", path: "/team" },
    { anchor: "nav-brand", path: "/" },
  ],
  account: [
    {},
    { anchor: "nav-dashboard", path: "/" },
    { anchor: "nav-projects", path: "/projects" },
    { anchor: "nav-tasks", path: "/tasks" },
    { anchor: "nav-approvals", path: "/approvals" },
    { anchor: "nav-teamChat", path: "/chat" },
    { anchor: "bell", path: "/" },
    {},
  ],
  production: [
    {},
    { anchor: "nav-dashboard", path: "/" },
    { anchor: "nav-tasks", path: "/tasks" },
    { anchor: "nav-projects", path: "/projects" },
    { anchor: "bell", path: "/" },
    { anchor: "nav-teamChat", path: "/chat" },
    {},
  ],
  client: [
    {},
    { anchor: "nav-dashboard", path: "/" },
    { anchor: "nav-projects", path: "/projects" },
    { anchor: "nav-approvals", path: "/approvals" },
    { anchor: "bell", path: "/" },
    {},
  ],
};
