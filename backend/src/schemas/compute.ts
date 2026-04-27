import { z } from "zod";

export const computeRequestSchema = z.object({
	arrival: z.string().min(1),
});

export type ComputeRequest = z.infer<typeof computeRequestSchema>;

export interface ComputeResponse {
	duration: number;
	route: string[];
}
