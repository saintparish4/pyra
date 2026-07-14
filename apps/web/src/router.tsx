import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppShell } from "./routes/AppShell";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { RootLayout } from "./routes/RootLayout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppShell,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, appRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
