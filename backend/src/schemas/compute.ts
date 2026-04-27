import { z } from "zod";

export const computeRequestSchema = z
	.object({
		arrival: z.string().min(1).describe("Planet the ship needs to reach"),
	})
	.describe("Body for POST /compute");

export const computeResponseSchema = z
	.object({
		duration: z
			.number()
			.int()
			.nonnegative()
			.describe("Total days, including refuel days"),
		route: z
			.array(z.string().min(1))
			.describe("Ordered planets visited; refuels do not duplicate a planet"),
	})
	.describe("Successful response of POST /compute");

export const errorResponseSchema = z
	.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
		}),
	})
	.describe("Uniform error envelope used across all 4xx/5xx responses");

export type ComputeRequest = z.infer<typeof computeRequestSchema>;
export type ComputeResponse = z.infer<typeof computeResponseSchema>;
