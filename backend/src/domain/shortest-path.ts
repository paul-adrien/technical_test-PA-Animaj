import { Heap } from "heap-js";
import type { Graph } from "./graph.js";

export interface ShortestPathResult {
	/** Total days, refuels included. */
	duration: number;
	/** Ordered planets visited; refuel stops do NOT duplicate the planet. */
	route: string[];
}

interface Node {
	planet: string;
	fuel: number;
	cost: number;
	prev: Node | null;
}

/**
 * Walk the `prev` chain from arrival back to departure, collecting planets in
 * visit order. Refuel transitions stay on the same planet, so we only push when
 * the planet changes.
 */
function reconstruct(end: Node): ShortestPathResult {
	const route: string[] = [end.planet];
	let cursor = end.prev;
	while (cursor !== null) {
		if (cursor.planet !== route[0]) {
			route.unshift(cursor.planet);
		}
		cursor = cursor.prev;
	}
	return { duration: end.cost, route };
}

/**
 * Dijkstra on the extended state graph `(planet, fuel)`.
 *
 * Two transitions from a state `(p, fuel)` with cumulated cost `c`:
 *   - jump to neighbor `n` (if `fuel ≥ travelTime(p, n)`):
 *       new state `(n, fuel - travelTime)`, new cost `c + travelTime`.
 *   - refuel on `p` (if `fuel < autonomy`):
 *       new state `(p, autonomy)`, new cost `c + 1`.
 *
 * Returns `null` if `arrival` is unreachable from `departure` (or either is
 * missing from the graph).
 */
export function findShortestPath(
	graph: Graph,
	autonomy: number,
	departure: string,
	arrival: string,
): ShortestPathResult | null {
	if (departure === arrival) {
		return { duration: 0, route: [departure] };
	}
	if (!graph.has(departure) || !graph.has(arrival)) {
		return null;
	}

	const heap = new Heap<Node>((a, b) => a.cost - b.cost);
	const visited = new Set<string>();

	heap.push({ planet: departure, fuel: autonomy, cost: 0, prev: null });

	while (heap.size() > 0) {
		const node = heap.pop() as Node;
		const key = `${node.planet}|${node.fuel}`;

		if (visited.has(key)) {
			continue;
		}
		visited.add(key);

		if (node.planet === arrival) {
			const result = reconstruct(node);
			return result;
		}

		if (node.fuel < autonomy) {
			heap.push({
				planet: node.planet,
				fuel: autonomy,
				cost: node.cost + 1,
				prev: node,
			});
		}

		const neighbors = graph.get(node.planet);
		if (neighbors) {
			for (const [neighbor, travelTime] of neighbors) {
				if (travelTime > node.fuel) {
					continue;
				}
				heap.push({
					planet: neighbor,
					fuel: node.fuel - travelTime,
					cost: node.cost + travelTime,
					prev: node,
				});
			}
		}
	}
	return null;
}
