import type { FastifyInstance, FastifyServerOptions } from "fastify";
import Fastify from "fastify";
import { ZodError } from "zod";
import type { LoadedConfig } from "./config.js";
import type { Graph } from "./domain/graph.js";
import { HttpError } from "./errors.js";
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

	app.setErrorHandler((error, request, reply) => {
		if (error instanceof HttpError) {
			return reply.status(error.statusCode).send({
				error: { code: error.code, message: error.message },
			});
		}
		if (error instanceof ZodError) {
			const message = error.issues
				.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
				.join(", ");
			return reply
				.status(400)
				.send({ error: { code: "INVALID_BODY", message } });
		}
		// Fastify built-in 4xx (malformed JSON, content-type errors, etc.)
		const status = (error as { statusCode?: number }).statusCode ?? 500;
		const message = error instanceof Error ? error.message : "Bad request";
		if (status >= 400 && status < 500) {
			return reply
				.status(status)
				.send({ error: { code: "INVALID_BODY", message } });
		}
		request.log.error({ err: error }, "unhandled error");
		return reply.status(500).send({
			error: { code: "INTERNAL_ERROR", message: "Internal server error" },
		});
	});

	app.get("/health", () => ({ status: "ok" }));
	registerComputeRoute(app);

	return app;
}
