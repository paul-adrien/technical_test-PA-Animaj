import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import Fastify from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
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

	// Wire Zod as the validator/serializer so route schemas can be plain Zod schemas
	// and request/response bodies are inferred end-to-end.
	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.decorate("config", config);
	app.decorate("graph", graph);

	registerErrorHandler(app);

	app.register(cors, {
		origin: process.env.CORS_ORIGIN ?? true,
		methods: ["GET", "POST"],
	});

	app.register(rateLimit, {
		max: Number(process.env.RATE_LIMIT_MAX ?? 100),
		timeWindow: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
	});

	app.register(swagger, {
		openapi: {
			info: {
				title: "Millennium Falcon API",
				description:
					"Computes one of the fastest routes for the Millennium Falcon to reach a target planet.",
				version: "1.0.0",
			},
		},
		transform: jsonSchemaTransform,
	});
	app.register(swaggerUi, {
		routePrefix: "/docs",
		uiConfig: { docExpansion: "list" },
	});

	// Routes are wrapped in a plugin scope so they're registered AFTER
	// @fastify/swagger in the plugin pipeline — otherwise its onRoute hook
	// runs before the routes exist and the OpenAPI spec is empty.
	app.register((scope, _opts, done) => {
		scope.get("/health", () => ({ status: "ok" }));
		registerComputeRoute(scope);
		done();
	});

	return app;
}
