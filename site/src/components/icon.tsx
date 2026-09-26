import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clapperboard,
  Database,
  Globe,
  Handshake,
  Inbox,
  Languages,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Mail,
  MessagesSquare,
  Palette,
  PenLine,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Workflow,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  arrow: ArrowRight,
  "badge-check": BadgeCheck,
  building: Building2,
  clapperboard: Clapperboard,
  dashboard: LayoutDashboard,
  database: Database,
  globe: Globe,
  grid: LayoutGrid,
  handshake: Handshake,
  inbox: Inbox,
  languages: Languages,
  layers: Layers,
  lock: Lock,
  mail: Mail,
  messages: MessagesSquare,
  palette: Palette,
  pen: PenLine,
  shield: ShieldCheck,
  trending: TrendingUp,
  "user-check": UserCheck,
  workflow: Workflow,
} as const;

export type IconName = keyof typeof ICONS;

/** Content files reference icons by name so they stay plain data. */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = ICONS[name];
  return <Cmp aria-hidden strokeWidth={1.75} {...props} />;
}
