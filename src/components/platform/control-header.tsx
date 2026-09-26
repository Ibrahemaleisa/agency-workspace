import Link from "next/link";
import { platformLogout } from "@/server/platform-admin-actions";
import { OperraWordmark } from "./operra-mark";

export function ControlHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-[#E3E4E0] bg-[#F6F6F3]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/operra" aria-label="Control center home">
          <OperraWordmark className="h-5 w-auto" />
        </Link>
        <span className="font-mono text-[11px] tracking-[0.08em] text-[#5A606B] uppercase">Control center</span>
        <div className="ms-auto flex items-center gap-4 text-sm">
          <span className="text-[#5A606B]">{name}</span>
          <form action={platformLogout}>
            <button className="underline underline-offset-4">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
