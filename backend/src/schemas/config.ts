import { z } from "zod";

export const configSchema = z.object({
	autonomy: z.number().int().positive(),
	departure: z.string().min(1),
	routes_db: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;
