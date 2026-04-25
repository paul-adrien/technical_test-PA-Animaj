import { buildApp } from "../../src/app.js";
import type { LoadedConfig } from "../../src/config.js";
import { buildGraph, type Graph } from "../../src/domain/graph.js";

const defaultConfig: LoadedConfig = {
	autonomy: 6,
	departure: "Tatooine",
	routes_db: "universe.db",
	routesDbPath: "/tmp/test-universe.db",
};

const defaultGraph: Graph = buildGraph([
	{ origin: "Tatooine", destination: "Hoth", travelTime: 6 },
	{ origin: "Hoth", destination: "Endor", travelTime: 1 },
]);

export interface TestAppOverrides {
	config?: Partial<LoadedConfig>;
	graph?: Graph;
}

export function buildTestApp(overrides: TestAppOverrides = {}) {
	return buildApp({
		config: { ...defaultConfig, ...overrides.config },
		graph: overrides.graph ?? defaultGraph,
	});
}
