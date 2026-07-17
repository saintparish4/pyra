import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { accounts, db, sessions, users, verifications } from "@pyra/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}
if (
  process.env.NODE_ENV === "production" &&
  (secret === "change-me-to-a-long-random-string" || secret.length < 32)
) {
  throw new Error(
    "BETTER_AUTH_SECRET must be a unique random string (>= 32 chars) in production — generate one with: openssl rand -base64 32",
  );
}

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:5173"],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    // usePlural makes the adapter resolve model "user" to the "users" key, etc.
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
  }),
  // better-auth only enables this in production by default; on everywhere so
  // dev behaves like prod. Sign-in gets its stricter built-in per-route rule.
  rateLimit: {
    enabled: true,
  },
  emailAndPassword: {
    enabled: true,
    // Public sign-up can't know a departmentId; users are provisioned per
    // department (see src/scripts/seed.ts for now, admin UI later).
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      departmentId: {
        type: "string",
        required: true,
        input: false,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "member",
        input: false,
      },
    },
  },
  // TODO(phase-h): TOTP via the twoFactor() plugin once email/password is
  // verified end-to-end — needs the two_factor table (drizzle generate) and
  // the matching client plugin in apps/web/src/lib/auth.ts.
});
