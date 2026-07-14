import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db, sessions, users } from "@pyra/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: {
      user: users,
      session: sessions,
      // account + verification tables aren't in packages/db/src/schema yet;
      // run `npx @better-auth/cli generate` once this config is final, then
      // `pnpm --filter @pyra/db generate` to turn the diff into a migration.
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  // plugins: [twoFactor()] — TOTP, later
});
