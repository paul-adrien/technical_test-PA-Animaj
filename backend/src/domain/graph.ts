import type { Travel } from "../schemas/travel.js";

/**
 * Adjacency map: planet → (neighbor → travel time in days).
 * Bidirectional. Duplicate edges are merged keeping the minimum travel time.
 */
export type Graph = Map<string, Map<string, number>>;

function addEdge(
	graph: Graph,
	from: string,
	to: string,
	travelTime: number,
): void {
	let neighbors = graph.get(from);
	if (!neighbors) {
		neighbors = new Map();
		graph.set(from, neighbors);
	}
	const existing = neighbors.get(to);
	if (existing === undefined || travelTime < existing) {
		neighbors.set(to, travelTime);
	}
}

export function buildGraph(travels: readonly Travel[]): Graph {
	const graph: Graph = new Map();
	for (const { origin, destination, travelTime } of travels) {
		addEdge(graph, origin, destination, travelTime);
		addEdge(graph, destination, origin, travelTime);
	}
	return graph;
}

export function assertPlanetExists(graph: Graph, planet: string): void {
	if (!graph.has(planet)) {
		throw new Error(`Planet "${planet}" is not present in the routes graph`);
	}
}
