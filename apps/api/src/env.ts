import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Must be the first import in src/index.ts: ESM evaluates each imported
// module fully, in source order, before the importer's own body runs — so
// this needs to be its own module (not an inline statement) listed before
// anything that reads process.env at module scope (e.g. @pyra/db).
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
