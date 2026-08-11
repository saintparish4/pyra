import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { accounts, db, departments, users } from "@pyra/db";

import { buildApp } from "../app.js";
import { appRouter } from "./router.js";

const DEPARTMENT = { name: "Integration Fire Department", slug: "integration" };
const ADMIN = {
	name: "Integration Admin",
	email: "admin@integration.local",
	password: "integration-test-password",
};

let app: Awaited<ReturnType<typeof buildApp>>;

/** `set-cookie` folded into the `cookie` header a browser would send back. */
function toCookieHeader(setCookie: string | string[] | number | undefined) {
	const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
	return entries
		.filter((entry): entry is string => typeof entry === "string")
		.map((entry) => entry.split(";")[0] ?? entry)
		.join("; ");
}

async function seedAdmin() {
	const [department] = await db
		.insert(departments)
		.values(DEPARTMENT)
		.returning();
	if (!department) {
		throw new Error("department insert returned no row");
	}

	const userId = randomUUID();
	await db.insert(users).values({
		id: userId,
		departmentId: department.id,
		name: ADMIN.name,
		email: ADMIN.email,
		emailVerified: true,
		role: "admin",
	});
	await db.insert(accounts).values({
		id: randomUUID(),
		userId,
		accountId: userId,
		providerId: "credential",
		password: await hashPassword(ADMIN.password),
	});

	return { departmentId: department.id, userId };
}

function signIn(password = ADMIN.password) {
	return app.inject({
		method: "POST",
		url: "/api/auth/sign-in/email",
		payload: { email: ADMIN.email, password },
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
		sql`truncate table accounts, sessions, users, verifications, departments restart identity cascade`,
	);
});

describe("protectedProcedure", () => {
	it("rejects a call with no session", async () => {
		const caller = appRouter.createCaller({ session: null });
		await expect(caller.auth.me()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});

describe("auth.me over the session cookie", () => {
	it("returns the signed-in user with their department", async () => {
		const seeded = await seedAdmin();

		const signedIn = await signIn();
		expect(signedIn.statusCode).toBe(200);

		const me = await app.inject({
			method: "GET",
			url: "/trpc/auth.me",
			headers: { cookie: toCookieHeader(signedIn.headers["set-cookie"]) },
		});

		expect(me.statusCode).toBe(200);
		expect(me.json()).toEqual({
			result: {
				data: {
					id: seeded.userId,
					name: ADMIN.name,
					email: ADMIN.email,
					role: "admin",
					departmentId: seeded.departmentId,
				},
			},
		});
	});

	it("answers 401 without the session cookie", async () => {
		await seedAdmin();

		const me = await app.inject({ method: "GET", url: "/trpc/auth.me" });

		expect(me.statusCode).toBe(401);
	});

	it("refuses a wrong password", async () => {
		await seedAdmin();

		const signedIn = await signIn("not-the-password");

		expect(signedIn.statusCode).toBe(401);
		expect(signedIn.headers["set-cookie"]).toBeUndefined();
	});
});
