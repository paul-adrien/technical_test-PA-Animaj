import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTravels } from "../../src/repository/travels.js";

interface RawRoute {
	origin: string;
	destination: string;
	travel_time: number;
}

describe("loadTravels", () => {
	let tmpDir: string;
	let dbPath: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "mf-travels-"));
		dbPath = join(tmpDir, "test.db");
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	const seedDatabase = (rows: RawRoute[]): void => {
		const db = new Database(dbPath);
		db.exec(
			"CREATE TABLE routes (origin TEXT, destination TEXT, travel_time UNSIGNED INTEGER)",
		);
		const stmt = db.prepare(
			"INSERT INTO routes (origin, destination, travel_time) VALUES (?, ?, ?)",
		);
		for (const row of rows) {
			stmt.run(row.origin, row.destination, row.travel_time);
		}
		db.close();
	};

	it("loads travels and converts travel_time to camelCase travelTime", () => {
		seedDatabase([
			{ origin: "Tatooine", destination: "Hoth", travel_time: 6 },
			{ origin: "Hoth", destination: "Endor", travel_time: 1 },
		]);

		const travels = loadTravels(dbPath);

		expect(travels).toEqual([
			{ origin: "Tatooine", destination: "Hoth", travelTime: 6 },
			{ origin: "Hoth", destination: "Endor", travelTime: 1 },
		]);
	});

	it("returns an empty array when the routes table has no rows", () => {
		seedDatabase([]);
		expect(loadTravels(dbPath)).toEqual([]);
	});

	it("throws a clear error when the database file does not exist", () => {
		expect(() => loadTravels(join(tmpDir, "missing.db"))).toThrow(
			/Cannot open SQLite database/,
		);
	});

	it("throws when the routes table is missing", () => {
		new Database(dbPath).close();
		expect(() => loadTravels(dbPath)).toThrow(/Failed to read travels/);
	});

	it("throws when a row has a non-positive travel_time", () => {
		seedDatabase([{ origin: "A", destination: "B", travel_time: 0 }]);
		expect(() => loadTravels(dbPath)).toThrow(/Invalid travel row at index 0/);
	});

	it("throws when a row has an empty origin", () => {
		seedDatabase([{ origin: "", destination: "B", travel_time: 1 }]);
		expect(() => loadTravels(dbPath)).toThrow(/Invalid travel row at index 0/);
	});
});
