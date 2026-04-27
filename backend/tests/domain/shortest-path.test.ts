import { describe, expect, it } from "vitest";
import { buildGraph } from "../../src/domain/graph.js";
import { findShortestPath } from "../../src/domain/shortest-path.js";
import type { Travel } from "../../src/schemas/travel.js";

const exampleTravels: Travel[] = [
	{ origin: "Tatooine", destination: "Dagobah", travelTime: 6 },
	{ origin: "Dagobah", destination: "Endor", travelTime: 4 },
	{ origin: "Dagobah", destination: "Hoth", travelTime: 1 },
	{ origin: "Hoth", destination: "Endor", travelTime: 1 },
	{ origin: "Tatooine", destination: "Hoth", travelTime: 6 },
];

describe("findShortestPath", () => {
	it("solves the README example: duration 8, route Tatooine→Hoth→Endor", () => {
		const graph = buildGraph(exampleTravels);
		const result = findShortestPath(graph, 6, "Tatooine", "Endor");

		expect(result).toEqual({
			duration: 8,
			route: ["Tatooine", "Hoth", "Endor"],
		});
	});

	it("returns duration 0 and a single-planet route when arrival equals departure", () => {
		const graph = buildGraph(exampleTravels);
		expect(findShortestPath(graph, 6, "Tatooine", "Tatooine")).toEqual({
			duration: 0,
			route: ["Tatooine"],
		});
	});

	it("returns null when arrival is missing from the graph", () => {
		const graph = buildGraph(exampleTravels);
		expect(findShortestPath(graph, 6, "Tatooine", "Coruscant")).toBeNull();
	});

	it("returns null when departure is missing from the graph", () => {
		const graph = buildGraph(exampleTravels);
		expect(findShortestPath(graph, 6, "Coruscant", "Endor")).toBeNull();
	});

	it("returns null when arrival sits in a disconnected component", () => {
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 1 },
			{ origin: "C", destination: "D", travelTime: 1 },
		]);
		expect(findShortestPath(graph, 6, "A", "C")).toBeNull();
	});

	it("forces a refuel when an edge would exceed the remaining fuel", () => {
		// A -3- B -3- C, autonomy=3 → must refuel on B before reaching C.
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 3 },
			{ origin: "B", destination: "C", travelTime: 3 },
		]);

		expect(findShortestPath(graph, 3, "A", "C")).toEqual({
			duration: 7, // 3 (A→B) + 1 (refuel on B) + 3 (B→C)
			route: ["A", "B", "C"],
		});
	});

	it("inserts a refuel even when fuel is not yet zero, if the next jump requires it", () => {
		// A -2- B -5- C with autonomy=5.
		// After A→B fuel=3, but B→C needs 5 → solver must refuel on B before jumping.
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 2 },
			{ origin: "B", destination: "C", travelTime: 5 },
		]);

		expect(findShortestPath(graph, 5, "A", "C")).toEqual({
			duration: 8, // 2 (A→B) + 1 (refuel on B) + 5 (B→C)
			route: ["A", "B", "C"],
		});
	});

	it("ignores edges whose travel time exceeds autonomy entirely", () => {
		// A -10- B with autonomy 5 → unreachable.
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 10 },
		]);
		expect(findShortestPath(graph, 5, "A", "B")).toBeNull();
	});

	it("picks the globally cheapest route, not the first one found", () => {
		// Two paths from A to D:
		//   A → B → D : 1 + 10 = 11
		//   A → C → D : 5 + 5  = 10  ← optimum
		const graph = buildGraph([
			{ origin: "A", destination: "B", travelTime: 1 },
			{ origin: "B", destination: "D", travelTime: 10 },
			{ origin: "A", destination: "C", travelTime: 5 },
			{ origin: "C", destination: "D", travelTime: 5 },
		]);

		expect(findShortestPath(graph, 10, "A", "D")).toEqual({
			duration: 10,
			route: ["A", "C", "D"],
		});
	});
});
