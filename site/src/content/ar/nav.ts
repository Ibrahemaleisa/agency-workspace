import type { NavGroup, NavLink } from "../en/nav";

export const MAIN_NAV: NavLink[] = [
  { href: "/product", label: "المنتج" },
  { href: "/features", label: "المزايا" },
  { href: "/solutions", label: "الحلول" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/demo", label: "العرض التجريبي" },
];

export const MOBILE_NAV: NavLink[] = [...MAIN_NAV, { href: "/about", label: "عن أوبيرّا" }, { href: "/contact", label: "تواصل معنا" }];

export const FOOTER_NAV: NavGroup[] = [
  {
    title: "المنتج",
    links: [
      { href: "/product", label: "نظرة عامة" },
      { href: "/features", label: "المزايا" },
      { href: "/demo", label: "العرض التفاعلي" },
      { href: "/pricing", label: "الأسعار" },
    ],
  },
  {
    title: "الحلول",
    links: [
      { href: "/solutions/content-and-social", label: "المحتوى والسوشال ميديا" },
      { href: "/solutions/production-studios", label: "استوديوهات الإنتاج" },
      { href: "/solutions/performance-marketing", label: "التسويق بالأداء والإعلانات" },
      { href: "/solutions/full-service-agencies", label: "الوكالات الشاملة والعقود الشهرية" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { href: "/about", label: "عن أوبيرّا" },
      { href: "/contact", label: "تواصل معنا" },
      { href: "/login", label: "تسجيل الدخول" },
      { href: "/start", label: "ابدأ التجربة المجانية" },
    ],
  },
];
