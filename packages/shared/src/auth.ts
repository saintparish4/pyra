import { z } from "zod";

import { departmentIdSchema, userIdSchema } from "./ids.js";

/**
 * Sign-in only checks that a password was typed — length rules belong to
 * better-auth's `minPasswordLength` at provisioning time, and enforcing them
 * here would lock out any account seeded before the rule changed.
 */
export const signInInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof signInInputSchema>;

/** `users.role` — text column defaulting to "member"; the seed grants "admin". */
export const userRoles = ["admin", "member"] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Shape returned by the `auth.me` tRPC query. */
export const sessionUserSchema = z.object({
  id: userIdSchema,
  name: z.string(),
  email: z.email(),
  role: userRoleSchema,
  departmentId: departmentIdSchema,
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
