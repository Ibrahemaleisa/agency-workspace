import { getLang } from "@/lib/lang";
import { dirOf } from "@/lib/i18n";

/** Public pages (landing, sign-in): bilingual, dark, Arabic-first. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <div lang={lang} dir={dirOf(lang)} className="font-arabic min-h-screen bg-ink text-zinc-100 antialiased">
      {children}
    </div>
  );
}
