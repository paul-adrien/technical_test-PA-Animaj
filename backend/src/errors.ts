import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

/**
 * Base class for errors that should map to a structured HTTP response.
 * `registerErrorHandler` checks `instanceof HttpError` to format the response uniformly.
 */
export class HttpError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "HttpError";
	}
}

/**
 * Thrown by the /compute handler when no path exists between the configured
 * departure and the requested arrival (or when arrival is unknown).
 */
export class NoRouteError extends HttpError {
	constructor(arrival: string) {
		super(404, "NO_ROUTE", `No route to ${arrival}`);
		this.name = "NoRouteError";
	}
}

export function registerErrorHandler(app: FastifyInstance): void {
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
}
