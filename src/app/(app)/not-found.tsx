import Link from "next/link";
import { getT } from "@/lib/lang";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200/80 bg-white p-6 text-center">
      <h2 className="text-base font-semibold">{t.errors.notFound}</h2>
      <p className="mt-2 text-sm text-zinc-500">{t.errors.notFoundBody}</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-600">
        {t.errors.backToDashboard}
      </Link>
    </div>
  );
}
