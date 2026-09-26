/**
 * Lets scripts import server modules outside Next: `server-only` becomes a no-op and
 * `next/navigation`'s notFound/redirect throw plain errors (as they do inside Next).
 *   tsx --import ./scripts/next-stubs.mjs scripts/….ts
 */
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const stubFile = fileURLToPath(new URL("./next-stubs.cjs", import.meta.url));
const stubbed = new Set(["server-only", "next/navigation"]);

// tsx compiles the app's TypeScript to CommonJS, so redirect `require` resolution.
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return stubbed.has(request) ? stubFile : resolve.call(this, request, ...rest);
};
require(stubFile);
