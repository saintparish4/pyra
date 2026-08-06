import { z } from "zod";

// Branded so a bare string can never be passed where a tenant scope is
// expected — the compiler forces every value to come through a parse.
// Drizzle hands back plain `string` columns, so rows crossing into API or
// web code get narrowed here at the boundary.

/** `departments.id` — a Postgres uuid (`defaultRandom()`). */
export const departmentIdSchema = z.uuid().brand<"DepartmentId">();
export type DepartmentId = z.infer<typeof departmentIdSchema>;

/**
 * `users.id` — a text column, not a uuid: better-auth mints its own ids and
 * only the seed script happens to use `randomUUID()`.
 */
export const userIdSchema = z.string().min(1).brand<"UserId">();
export type UserId = z.infer<typeof userIdSchema>;
