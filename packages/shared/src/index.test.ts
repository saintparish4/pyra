import assert from "node:assert/strict";
import { test } from "node:test";

import { sessionUserSchema, signInInputSchema } from "./auth.js";
import { apiErrorSchema } from "./errors.js";
import { departmentIdSchema, userIdSchema } from "./ids.js";

const DEPARTMENT_ID = "3f1a7c2e-9b84-4d51-8c6f-2a0e5d7b1c93";

void test("departmentIdSchema accepts a uuid and rejects a bare string", () => {
  assert.equal(departmentIdSchema.parse(DEPARTMENT_ID), DEPARTMENT_ID);
  assert.equal(departmentIdSchema.safeParse("bluesky").success, false);
});

void test("userIdSchema accepts any non-empty id", () => {
  // better-auth ids are not uuids, so this must not be uuid-constrained.
  assert.equal(userIdSchema.parse("QLmT3xR8"), "QLmT3xR8");
  assert.equal(userIdSchema.safeParse("").success, false);
});

void test("signInInputSchema requires a well-formed email and a password", () => {
  assert.deepEqual(signInInputSchema.parse({ email: "admin@pyra.local", password: "hunter2" }), {
    email: "admin@pyra.local",
    password: "hunter2",
  });
  assert.equal(signInInputSchema.safeParse({ email: "admin", password: "hunter2" }).success, false);
  assert.equal(
    signInInputSchema.safeParse({ email: "admin@pyra.local", password: "" }).success,
    false,
  );
});

void test("sessionUserSchema matches the auth.me payload", () => {
  const parsed = sessionUserSchema.parse({
    id: "QLmT3xR8",
    name: "Admin",
    email: "admin@pyra.local",
    role: "admin",
    departmentId: DEPARTMENT_ID,
  });
  assert.equal(parsed.departmentId, DEPARTMENT_ID);
  assert.equal(parsed.role, "admin");
});

void test("sessionUserSchema rejects an unknown role", () => {
  const result = sessionUserSchema.safeParse({
    id: "QLmT3xR8",
    name: "Admin",
    email: "admin@pyra.local",
    role: "superuser",
    departmentId: DEPARTMENT_ID,
  });
  assert.equal(result.success, false);
});

void test("apiErrorSchema carries a tRPC code and optional field errors", () => {
  assert.equal(apiErrorSchema.parse({ code: "UNAUTHORIZED", message: "nope" }).code, "UNAUTHORIZED");

  const withFields = apiErrorSchema.parse({
    code: "BAD_REQUEST",
    message: "invalid",
    fieldErrors: { email: ["Enter a valid email"] },
  });
  assert.deepEqual(withFields.fieldErrors, { email: ["Enter a valid email"] });

  assert.equal(apiErrorSchema.safeParse({ code: "TEAPOT", message: "no" }).success, false);
});
