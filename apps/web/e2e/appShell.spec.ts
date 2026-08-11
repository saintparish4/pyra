import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@pyra.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "pyra-dev-admin";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.getByLabel("Email").fill(ADMIN_EMAIL);
	await page.getByLabel("Password").fill(ADMIN_PASSWORD);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/app$/);
}

test("sends a signed-out visitor from the workspace to login", async ({
	page,
}) => {
	await page.goto("/app");

	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("shows the signed-in member and their role", async ({ page }) => {
	await signIn(page);

	// Rendered from the tRPC auth.me query, so this also covers the session
	// cookie reaching a protected procedure.
	await expect(
		page.getByText(new RegExp(`Signed in as .*\\(${ADMIN_EMAIL}, admin\\)`)),
	).toBeVisible();
});

test("signs out back to the login page", async ({ page }) => {
	await signIn(page);

	await page.getByRole("button", { name: "Sign out" }).click();

	await expect(page).toHaveURL(/\/login$/);
});
