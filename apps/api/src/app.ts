import cors from "@fastify/cors";
import type { FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";
import fastify from "fastify";

import { auth } from "./auth/index.js";
import { createContext } from "./trpc/context.js";
import { appRouter, type AppRouter } from "./trpc/router.js";

export const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

export async function buildApp({ logger = true }: { logger?: boolean } = {}) {
	const app = fastify({
		logger,
		routerOptions: {
			maxParamLength: 5000,
		},
	});

	// credentials: true + an explicit origin (not "*") so better-auth's session
	// cookie survives the web app's cross-origin fetches in dev (5173 -> 3001).
	await app.register(cors, {
		origin: webOrigin,
		credentials: true,
	});

	app.get("/health", () => ({ ok: true }));

	// better-auth handles its own routing under this prefix (sign-up, sign-in,
	// sign-out, session, ...); see src/auth/index.ts for enabled methods.
	app.route({
		method: ["GET", "POST"],
		url: "/api/auth/*",
		async handler(request, reply) {
			try {
				const url = new URL(
					request.url,
					`http://${request.headers.host ?? "localhost"}`,
				);
				const headers = fromNodeHeaders(request.headers);
				const hasBody = request.method !== "GET" && request.method !== "HEAD";
				const req = new Request(url, {
					method: request.method,
					headers,
					...(hasBody ? { body: JSON.stringify(request.body) } : {}),
				});

				const response = await auth.handler(req);

				reply.status(response.status);
				for (const [key, value] of response.headers) {
					reply.header(key, value);
				}
				reply.send(response.body ? await response.text() : null);
			} catch (error) {
				app.log.error({ err: error }, "auth handler error");
				reply.status(500).send({ error: "Internal authentication error" });
			}
		},
	});

	await app.register(fastifyTRPCPlugin, {
		prefix: "/trpc",
		trpcOptions: {
			router: appRouter,
			createContext,
			onError({ path, error }) {
				app.log.error({ path, err: error }, "tRPC error");
			},
		} satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
	});

	return app;
}
