import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { accounts, auditLog, db, departments, users, withTenant } from "@pyra/db";
import { type DepartmentId, departmentIdSchema } from "@pyra/shared";

import { buildApp } from "../app.js";
import { recordAudit } from "./audit.js";

let app: Awaited<ReturnType<typeof buildApp>>;

interface Tenant {
	departmentId: DepartmentId;
	userId: string;
	email: string;
}

const PASSWORD = "tenancy-test-password";

async function seedTenant(slug: string, role: string): Promise<Tenant> {
	const [department] = await db
		.insert(departments)
		.values({ name: `${slug} Fire Department`, slug })
		.returning();
	if (!department) {
		throw new Error("department insert returned no row");
	}
	const userId = randomUUID();
	const email = `chief@${slug}.local`;
	await db.insert(users).values({
		id: userId,
		departmentId: department.id,
		name: `${slug} chief`,
		email,
		emailVerified: true,
		role,
	});
	await db.insert(accounts).values({
		id: randomUUID(),
		userId,
		accountId: userId,
		providerId: "credential",
		password: await hashPassword(PASSWORD),
	});
	return { departmentId: departmentIdSchema.parse(department.id), userId, email };
}

async function writeAudit(tenant: Tenant, entityId: string): Promise<void> {
	await withTenant(tenant.departmentId, (tx) =>
		recordAudit(tx, {
			departmentId: tenant.departmentId,
			actorUserId: tenant.userId,
			entityType: "incident",
			entityId,
			action: "create",
		}),
	);
}

function toCookieHeader(setCookie: string | string[] | number | undefined): string {
	const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
	return entries
		.filter((entry): entry is string => typeof entry === "string")
		.map((entry) => entry.split(";")[0] ?? entry)
		.join("; ");
}

async function signIn(email: string): Promise<string> {
	const response = await app.inject({
		method: "POST",
		url: "/api/auth/sign-in/email",
		payload: { email, password: PASSWORD },
	});
	expect(response.statusCode).toBe(200);
	return toCookieHeader(response.headers["set-cookie"]);
}

function listAudit(cookie: string, departmentId: string) {
	return app.inject({
		method: "GET",
		url: `/trpc/audit.list?input=${encodeURIComponent(JSON.stringify({ departmentId }))}`,
		headers: { cookie },
	});
}

beforeAll(async () => {
	app = await buildApp({ logger: false });
	await app.ready();
});

afterAll(async () => {
	await app.close();
	await db.$client.end();
});

beforeEach(async () => {
	await db.execute(
		sql`truncate table audit_log, accounts, sessions, users, verifications, departments restart identity cascade`,
	);
});

describe("row-level security", () => {
	it("shows a department only its own rows", async () => {
		const alpha = await seedTenant("alpha", "officer");
		const bravo = await seedTenant("bravo", "officer");
		await writeAudit(alpha, "incident-alpha");
		await writeAudit(bravo, "incident-bravo");

		const rows = await withTenant(alpha.departmentId, (tx) => tx.select().from(auditLog));

		expect(rows).toHaveLength(1);
		expect(rows[0]?.entityId).toBe("incident-alpha");
	});

	it("refuses to write a row into another department", async () => {
		const alpha = await seedTenant("alpha", "officer");
		const bravo = await seedTenant("bravo", "officer");

		await expect(
			withTenant(alpha.departmentId, (tx) =>
				recordAudit(tx, {
					departmentId: bravo.departmentId,
					actorUserId: alpha.userId,
					entityType: "incident",
					entityId: "smuggled",
					action: "create",
				}),
			),
		).rejects.toThrow();

		const rows = await withTenant(bravo.departmentId, (tx) => tx.select().from(auditLog));
		expect(rows).toHaveLength(0);
	});

	it("returns nothing when no department scope is set", async () => {
		const alpha = await seedTenant("alpha", "officer");
		await writeAudit(alpha, "incident-alpha");

		// Outside withTenant, app.department_id is unset. The policy compares
		// against NULL, which is never true — so an unscoped connection fails
		// closed rather than seeing every department.
		const rows = await db.select().from(auditLog);

		expect(rows).toHaveLength(0);
	});
});

describe("audit.list", () => {
	it("returns the caller's own department", async () => {
		const alpha = await seedTenant("alpha", "officer");
		const bravo = await seedTenant("bravo", "officer");
		await writeAudit(alpha, "incident-alpha");
		await writeAudit(bravo, "incident-bravo");

		const response = await listAudit(await signIn(alpha.email), alpha.departmentId);

		expect(response.statusCode).toBe(200);
		const rows = response.json().result.data as { entityId: string }[];
		expect(rows.map((row) => row.entityId)).toEqual(["incident-alpha"]);
	});

	it("rejects a caller that forges another department's id", async () => {
		const alpha = await seedTenant("alpha", "officer");
		const bravo = await seedTenant("bravo", "officer");
		await writeAudit(bravo, "incident-bravo");

		const response = await listAudit(await signIn(alpha.email), bravo.departmentId);

		expect(response.statusCode).toBe(403);
	});

	it("refuses a role that cannot read the audit log", async () => {
		const alpha = await seedTenant("alpha", "member");

		const response = await listAudit(await signIn(alpha.email), alpha.departmentId);

		expect(response.statusCode).toBe(403);
	});
});
