import type { FastifyInstance } from "fastify";
import { findShortestPath } from "../domain/shortest-path.js";
import { NoRouteError } from "../errors.js";
import {
	type ComputeResponse,
	computeRequestSchema,
} from "../schemas/compute.js";

export function registerComputeRoute(app: FastifyInstance): void {
	app.post("/compute", (request): ComputeResponse => {
		const body = computeRequestSchema.parse(request.body);

		const result = findShortestPath(
			app.graph,
			app.config.autonomy,
			app.config.departure,
			body.arrival,
		);

		if (result === null) {
			throw new NoRouteError(body.arrival);
		}
		return result;
	});
}
