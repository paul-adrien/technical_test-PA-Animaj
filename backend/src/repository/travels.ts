import { type Travel, travelSchema } from "../schemas/travel.js";
import { openReadOnlyDatabase } from "./database.js";

export function loadTravels(dbPath: string): Travel[] {
	const db = openReadOnlyDatabase(dbPath);

	try {
		const rows = db
			.prepare("SELECT origin, destination, travel_time FROM routes")
			.all();

		return rows.map((row, i) => {
			const result = travelSchema.safeParse(row);
			if (!result.success) {
				throw new Error(
					`Invalid travel row at index ${i} in ${dbPath}: ${result.error.issues
						.map((issue) => `${issue.path.join(".")} ${issue.message}`)
						.join(", ")}`,
				);
			}
			return result.data;
		});
	} catch (err) {
		if (err instanceof Error && err.message.startsWith("Invalid travel row")) {
			throw err;
		}
		throw new Error(`Failed to read travels from ${dbPath}`, { cause: err });
	} finally {
		db.close();
	}
}
