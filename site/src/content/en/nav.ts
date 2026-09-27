export type NavLink = { href: string; label: string };
export type NavGroup = { title: string; links: NavLink[] };

export const MAIN_NAV: NavLink[] = [
  { href: "/product", label: "Product" },
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
];

/** Mobile menu: main navigation plus company pages. */
export const MOBILE_NAV: NavLink[] = [...MAIN_NAV, { href: "/about", label: "About" }, { href: "/contact", label: "Contact" }];

export const FOOTER_NAV: NavGroup[] = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Overview" },
      { href: "/features", label: "Features" },
      { href: "/demo", label: "Interactive demo" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { href: "/solutions/content-and-social", label: "Content & social" },
      { href: "/solutions/production-studios", label: "Production studios" },
      { href: "/solutions/performance-marketing", label: "Performance & paid media" },
      { href: "/solutions/full-service-agencies", label: "Full-service & retainers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Log in" },
      { href: "/start", label: "Start free trial" },
    ],
  },
];
