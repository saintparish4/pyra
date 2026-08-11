import { createAuthClient } from "better-auth/react";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// TODO(phase-h): add twoFactorClient() here when TOTP lands on the API.
export const authClient = createAuthClient({
	baseURL: apiUrl,
	fetchOptions: {
		credentials: "include",
	},
});
