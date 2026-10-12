import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { organizations, platformAudit } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { ControlHeader } from "@/components/platform/control-header";
import { Table, Td } from "@/components/platform/control-ui";

const PAGE = 100;

/** Who did what in the control center (and customer-side workspace deletions), newest first. */
export default async function ControlAudit({ searchParams }: PageProps<"/operra/audit">) {
  const admin = await requirePlatformAdmin();
  const n = Number((await searchParams).page);
  const page = Number.isInteger(n) && n > 1 ? n : 1;
  const rows = await db
    .select({ entry: platformAudit, orgName: organizations.name, orgSerial: organizations.serial })
    .from(platformAudit)
    .leftJoin(organizations, eq(organizations.id, platformAudit.orgId))
    .orderBy(desc(platformAudit.createdAt), desc(platformAudit.id))
    .limit(PAGE + 1)
    .offset((page - 1) * PAGE);
  const hasMore = rows.length > PAGE;
  return (
    <>
      <ControlHeader name={admin.name} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-[#5B606B]">Every change made from the control center, and workspaces deleted by their owners.</p>
        <div className="mt-6">
          <Table head={["When", "Who", "Action", "Workspace / target", "Details"]} empty={rows.length === 0 && "Nothing yet."}>
            {rows.slice(0, PAGE).map(({ entry: e, orgName, orgSerial }) => (
              <tr key={e.id}>
                <Td mono muted>{format(e.createdAt, "d MMM yyyy, HH:mm")}</Td>
                <Td>{e.adminEmail}</Td>
                <Td mono>{e.action}</Td>
                <Td>
                  {e.orgId && orgName ? (
                    <Link href={`/operra/customers/${e.orgId}`} className="underline-offset-4 hover:underline">
                      {orgName} <span className="font-mono text-xs text-[#5B606B]">{orgSerial}</span>
                    </Link>
                  ) : null}
                  {e.target && <div className="font-mono text-xs text-[#5B606B]">{e.target}</div>}
                </Td>
                <Td muted>
                  <span className="font-mono text-xs break-all">{e.meta ? JSON.stringify(e.meta) : ""}</span>
                </Td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="mt-4 flex justify-between text-sm">
          {page > 1 ? <Link href={`/operra/audit?page=${page - 1}`} className="underline">Newer</Link> : <span />}
          {hasMore && <Link href={`/operra/audit?page=${page + 1}`} className="underline">Older</Link>}
        </div>
      </main>
    </>
  );
}
