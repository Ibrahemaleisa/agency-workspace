/**
 * Creates one visitor-style private copy of the sample agency (as the public demo does), so CI can
 * check isolation between two agencies: npm run db:seed && npm run db:demo-copy && npm run verify:isolation
 */
import "dotenv/config";
import { createDemoCopy } from "../src/lib/demo-sandbox";

createDemoCopy({ name: "Isolation Check", lang: "en" })
  .then((org) => {
    console.log(`✓ Demo copy ${org.slug}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
