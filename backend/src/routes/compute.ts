import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { findShortestPath } from "../domain/shortest-path.js";
import { NoRouteError } from "../errors.js";
import {
	computeRequestSchema,
	computeResponseSchema,
	errorResponseSchema,
} from "../schemas/compute.js";

export function registerComputeRoute(app: FastifyInstance): void {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/compute",
		{
			schema: {
				summary: "Compute a fastest route to the requested planet",
				description:
					"Returns one of the routes with the lowest total duration (refuels included). Status 404 if no route exists.",
				tags: ["compute"],
				body: computeRequestSchema,
				response: {
					200: computeResponseSchema,
					400: errorResponseSchema,
					404: errorResponseSchema,
					429: errorResponseSchema,
					500: errorResponseSchema,
				},
			},
		},
		(request) => {
			const result = findShortestPath(
				app.graph,
				app.config.autonomy,
				app.config.departure,
				request.body.arrival,
			);
			if (result === null) {
				throw new NoRouteError(request.body.arrival);
			}
			return result;
		},
	);
}
