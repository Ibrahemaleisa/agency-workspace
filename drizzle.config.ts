import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  throw new Error(
    "No database connected: DATABASE_URL (or POSTGRES_URL) is not set. " +
      "On Vercel: open the project's Storage tab, connect a Postgres database (e.g. Neon) to this project, then redeploy.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
