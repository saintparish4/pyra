import "../env.js";

import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

import { accounts, db, departments, users } from "@pyra/db";

const DEPARTMENT = { name: "Bluesky Fire Department", slug: "bluesky" };

// Defaults are for local dev only; set SEED_ADMIN_* to seed real credentials.
const passwordFromEnv = Boolean(process.env.SEED_ADMIN_PASSWORD);
const ADMIN = {
	name: process.env.SEED_ADMIN_NAME ?? "Admin",
	email: process.env.SEED_ADMIN_EMAIL ?? "admin@pyra.local",
	password: process.env.SEED_ADMIN_PASSWORD ?? "pyra-dev-admin",
};

if (process.env.NODE_ENV === "production" && !passwordFromEnv) {
	console.error(
		"refusing to seed the well-known dev password in production; set SEED_ADMIN_PASSWORD",
	);
	process.exit(1);
}

async function seed() {
	const [department] = await db
		.insert(departments)
		.values(DEPARTMENT)
		.onConflictDoUpdate({
			target: departments.slug,
			set: { name: DEPARTMENT.name },
		})
		.returning();
	if (!department) {
		throw new Error("department upsert returned no row");
	}

	const existing = await db.query.users.findFirst({
		where: eq(users.email, ADMIN.email),
	});
	if (existing) {
		console.log(`admin ${ADMIN.email} already exists, nothing to do`);
		return;
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

	// better-auth reads email/password credentials from an account row with
	// providerId "credential"; hashPassword matches its scrypt format, so
	// signInEmail verifies this seeded password.
	await db.insert(accounts).values({
		id: randomUUID(),
		userId,
		accountId: userId,
		providerId: "credential",
		password: await hashPassword(ADMIN.password),
	});

	console.log(
		`seeded department "${department.slug}" and admin ${ADMIN.email}` +
			(passwordFromEnv ? "" : ` (password: ${ADMIN.password})`),
	);
}

try {
	await seed();
	process.exit(0);
} catch (error) {
	console.error(error);
	process.exit(1);
}
