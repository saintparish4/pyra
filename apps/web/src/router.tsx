import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";

import { AppShell } from "./routes/AppShell";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login";
import { RootLayout } from "./routes/RootLayout";
import { AdminPage, AdrsPage, DeployPage, ImportPage, SchemaPage } from "./routes/stubs";

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

const deployRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deploy",
  component: DeployPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const importRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/import",
  component: ImportPage,
});

const schemaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schema",
  component: SchemaPage,
});

const adrsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/adrs",
  component: AdrsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute,
  deployRoute,
  adminRoute,
  importRoute,
  schemaRoute,
  adrsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
