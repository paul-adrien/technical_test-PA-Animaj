import { buildApp } from "../../src/app.js";
import type { LoadedConfig } from "../../src/config.js";

const defaultConfig: LoadedConfig = {
	autonomy: 6,
	departure: "Tatooine",
	routes_db: "universe.db",
	routesDbPath: "/tmp/test-universe.db",
};

export function buildTestApp(overrides: Partial<LoadedConfig> = {}) {
	return buildApp({ config: { ...defaultConfig, ...overrides } });
}
