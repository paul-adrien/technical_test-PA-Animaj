import { describe, expect, it } from "vitest";
import { assertPlanetExists, buildGraph } from "../../src/domain/graph.js";

describe("buildGraph", () => {
	it("creates a bidirectional edge for each travel", () => {
		const graph = buildGraph([
			{ origin: "Tatooine", destination: "Hoth", travelTime: 6 },
		]);

		expect(graph.get("Tatooine")?.get("Hoth")).toBe(6);
		expect(graph.get("Hoth")?.get("Tatooine")).toBe(6);
	});

	it("merges duplicate edges keeping the minimum travel time", () => {
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 5 },
			{ origin: "A", destination: "B", travelTime: 3 },
			{ origin: "B", destination: "A", travelTime: 7 },
		]);

		expect(graph.get("A")?.get("B")).toBe(3);
		expect(graph.get("B")?.get("A")).toBe(3);
	});

	it("returns an empty graph when given no travels", () => {
		expect(buildGraph([]).size).toBe(0);
	});

	it("indexes all neighbors of a planet", () => {
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 1 },
			{ origin: "A", destination: "C", travelTime: 2 },
			{ origin: "B", destination: "D", travelTime: 3 },
		]);

		expect(Array.from(graph.get("A")?.keys() ?? [])).toEqual(["B", "C"]);
		expect(graph.get("D")?.get("B")).toBe(3);
	});
});

describe("assertPlanetExists", () => {
	const graph = buildGraph([
		{ origin: "Tatooine", destination: "Endor", travelTime: 1 },
	]);

	it("does nothing when the planet exists in the graph", () => {
		expect(() => assertPlanetExists(graph, "Tatooine")).not.toThrow();
		expect(() => assertPlanetExists(graph, "Endor")).not.toThrow();
	});

	it("throws when the planet is not present", () => {
		expect(() => assertPlanetExists(graph, "Coruscant")).toThrow(/Coruscant/);
	});
});
