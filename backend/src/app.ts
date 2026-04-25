import Fastify from "fastify";
import type { FastifyInstance, FastifyServerOptions } from "fastify";

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
	const app = Fastify(opts);

	app.get("/health", () => ({ status: "ok" }));

	return app;
}
