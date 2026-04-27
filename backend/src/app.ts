import type { FastifyInstance, FastifyServerOptions } from "fastify";
import Fastify from "fastify";
import type { LoadedConfig } from "./config.js";
import type { Graph } from "./domain/graph.js";
import { registerErrorHandler } from "./errors.js";
import { registerComputeRoute } from "./routes/compute.js";

declare module "fastify" {
	interface FastifyInstance {
		config: LoadedConfig;
		graph: Graph;
	}
}

export interface BuildAppOptions extends FastifyServerOptions {
	config: LoadedConfig;
	graph: Graph;
}

export function buildApp(opts: BuildAppOptions): FastifyInstance {
	const { config, graph, ...fastifyOpts } = opts;
	const app = Fastify(fastifyOpts);
	app.decorate("config", config);
	app.decorate("graph", graph);

	registerErrorHandler(app);

	app.get("/health", () => ({ status: "ok" }));
	registerComputeRoute(app);

	return app;
}
