import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { httpBatchLink } from "@trpc/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { trpc } from "./lib/trpc";
import { router } from "./router";
import "./index.css";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: `${apiUrl}/trpc`,
			fetch(url, options) {
				// tRPC types `signal` as optional-undefined, the DOM types it as
				// `AbortSignal | null`; spreading it through would not narrow.
				return fetch(url, {
					...options,
					credentials: "include",
					signal: options?.signal ?? null,
				});
			},
		}),
	],
});

const rootEl = document.getElementById("root");
if (!rootEl) {
	throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
	<StrictMode>
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</trpc.Provider>
	</StrictMode>,
);
