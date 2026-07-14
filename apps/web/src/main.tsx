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
        return fetch(url, { ...options, credentials: "include" });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
