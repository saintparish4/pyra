import { expect, test } from "@playwright/test";

// Defaults match `pnpm --filter @pyra/api seed`; override when the instance
// under test was seeded with real credentials.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@pyra.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "pyra-dev-admin";

test("signs in with seeded credentials and reaches the workspace", async ({
	page,
}) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(ADMIN_EMAIL);
	await page.getByLabel("Password").fill(ADMIN_PASSWORD);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/app$/);
	await expect(page.getByRole("heading", { name: "App" })).toBeVisible();
});

test("keeps a wrong password on the login page and says why", async ({
	page,
}) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill(ADMIN_EMAIL);
	await page.getByLabel("Password").fill("not-the-password");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page.getByRole("alert")).toBeVisible();
	await expect(page).toHaveURL(/\/login$/);
});
