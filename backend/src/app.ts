import type { FastifyInstance, FastifyServerOptions } from "fastify";
import Fastify from "fastify";
import type { LoadedConfig } from "./config.js";

declare module "fastify" {
	interface FastifyInstance {
		config: LoadedConfig;
	}
}

export interface BuildAppOptions extends FastifyServerOptions {
	config: LoadedConfig;
}

export function buildApp(opts: BuildAppOptions): FastifyInstance {
	const { config, ...fastifyOpts } = opts;
	const app = Fastify(fastifyOpts);
	app.decorate("config", config);

	app.get("/health", () => ({ status: "ok" }));

	return app;
}
