import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = mkdtempSync(join(tmpdir(), "mf-config-"));
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	const writeConfig = (content: string): string => {
		const path = join(tmpDir, "millennium-falcon.json");
		writeFileSync(path, content);
		return path;
	};

	it("loads a valid config and resolves a relative routes_db against the config file", () => {
		const path = writeConfig(
			JSON.stringify({
				autonomy: 6,
				departure: "Tatooine",
				routes_db: "universe.db",
			}),
		);

		const config = loadConfig(path);

		expect(config.autonomy).toBe(6);
		expect(config.departure).toBe("Tatooine");
		expect(config.routes_db).toBe("universe.db");
		expect(config.routesDbPath).toBe(join(tmpDir, "universe.db"));
	});

	it("keeps an absolute routes_db path as-is", () => {
		const absoluteDb = resolve("/tmp/some-absolute-universe.db");
		const path = writeConfig(
			JSON.stringify({
				autonomy: 6,
				departure: "Tatooine",
				routes_db: absoluteDb,
			}),
		);

		const config = loadConfig(path);

		expect(config.routesDbPath).toBe(absoluteDb);
	});

	it("does NOT resolve routes_db against the current working directory", () => {
		const path = writeConfig(
			JSON.stringify({
				autonomy: 6,
				departure: "Tatooine",
				routes_db: "universe.db",
			}),
		);

		const config = loadConfig(path);

		expect(config.routesDbPath).not.toBe(resolve(process.cwd(), "universe.db"));
		expect(config.routesDbPath).toBe(resolve(tmpDir, "universe.db"));
	});

	it("throws on missing file", () => {
		expect(() => loadConfig(join(tmpDir, "does-not-exist.json"))).toThrow(
			/Cannot read config file/,
		);
	});

	it("throws on invalid JSON", () => {
		const path = writeConfig("{ not json");
		expect(() => loadConfig(path)).toThrow(/Invalid JSON/);
	});

	it("throws on missing required fields", () => {
		const path = writeConfig(JSON.stringify({ autonomy: 6 }));
		expect(() => loadConfig(path)).toThrow(/Invalid config/);
	});

	it("throws when autonomy is not a positive integer", () => {
		const path = writeConfig(
			JSON.stringify({
				autonomy: 0,
				departure: "Tatooine",
				routes_db: "universe.db",
			}),
		);
		expect(() => loadConfig(path)).toThrow(/Invalid config/);
	});

	it("throws when departure is empty", () => {
		const path = writeConfig(
			JSON.stringify({
				autonomy: 6,
				departure: "",
				routes_db: "universe.db",
			}),
		);
		expect(() => loadConfig(path)).toThrow(/Invalid config/);
	});
});
