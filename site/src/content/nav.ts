export const MAIN_NAV = [
  { href: "/product", label: "Product" },
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
] as const;

export const FOOTER_NAV = [
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
] as const;
