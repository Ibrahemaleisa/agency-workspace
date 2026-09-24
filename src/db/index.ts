import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres((process.env.DATABASE_URL ?? process.env.POSTGRES_URL)!, {
    max: process.env.VERCEL ? 3 : 10, // serverless: keep per-instance pools small
    prepare: false, // compatible with pooled (PgBouncer) connection strings
    onnotice: () => {},
  });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
