import {
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
} from "@tanstack/react-router";

import { Home } from "./routes/home";
import { RootLayout } from "./routes/rootLayout";

/*
 * Only the landing page is in the first bundle. Everything behind it pulls in
 * better-auth and the workspace shell, which a visitor reading the marketing
 * page never needs — and that visitor is most of the traffic.
 */
const lazyStub = (name: keyof typeof import("./routes/stubs")) =>
	lazyRouteComponent(() => import("./routes/stubs"), name);

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
	component: lazyRouteComponent(() => import("./routes/login"), "Login"),
});

const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/app",
	component: lazyRouteComponent(() => import("./routes/appShell"), "AppShell"),
});

const deployRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/deploy",
	component: lazyStub("DeployPage"),
});

const adminRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/admin",
	component: lazyStub("AdminPage"),
});

const importRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/import",
	component: lazyStub("ImportPage"),
});

const schemaRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/schema",
	component: lazyStub("SchemaPage"),
});

const adrsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/adrs",
	component: lazyStub("AdrsPage"),
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
