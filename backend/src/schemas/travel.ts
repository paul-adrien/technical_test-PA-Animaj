import { z } from "zod";

/**
 * Schema matching the raw row stored in the SQLite `routes` table.
 * Validates and converts snake_case `travel_time` to camelCase `travelTime`.
 */
export const travelSchema = z
	.object({
		origin: z.string().min(1),
		destination: z.string().min(1),
		travel_time: z.number().int().positive(),
	})
	.transform((row) => ({
		origin: row.origin,
		destination: row.destination,
		travelTime: row.travel_time,
	}));

export type Travel = z.infer<typeof travelSchema>;
