import { describe, expect, it } from "vitest";
import { buildGraph } from "../../src/domain/graph.js";
import { findShortestPath } from "../../src/domain/shortest-path.js";
import type { Travel } from "../../src/schemas/travel.js";

/**
 * Mulberry32 — small seedable PRNG, deterministic so the stress test is
 * reproducible across machines and runs.
 */
function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Stress test designed to force a LONG shortest path (no global shortcuts).
 *   - A linear chain P0 → P1 → ... → P(N-1) is the only way across.
 *   - Extra edges are restricted to a local window (offset ≤ 8), so they add
 *     branching for Dijkstra to explore but don't create a shortcut to the end.
 *   - Low autonomy + variable travel times → many forced refuels along the way.
 */
describe("findShortestPath — stress test", () => {
	it("solves a 50,000-planet chain with local shortcuts and low autonomy", {
		timeout: 15_000,
	}, () => {
		const PLANETS = 50_000;
		const LOCAL_SHORTCUTS = 500;
		const SHORTCUT_MAX_OFFSET = 8;
		const AUTONOMY = 5;
		const SEED = 42;

		const rand = mulberry32(SEED);
		const travels: Travel[] = [];

		// Linear chain — the spine of the graph.
		for (let i = 0; i < PLANETS - 1; i++) {
			travels.push({
				origin: `P${i}`,
				destination: `P${i + 1}`,
				travelTime: 1 + Math.floor(rand() * AUTONOMY),
			});
		}

		// Local-only shortcuts (skip ≤ 8 planets) — branching, not real bypasses.
		for (let i = 0; i < LOCAL_SHORTCUTS; i++) {
			const a = Math.floor(rand() * (PLANETS - SHORTCUT_MAX_OFFSET - 1));
			const offset = 2 + Math.floor(rand() * (SHORTCUT_MAX_OFFSET - 1));
			const b = a + offset;
			travels.push({
				origin: `P${a}`,
				destination: `P${b}`,
				travelTime: 1 + Math.floor(rand() * AUTONOMY),
			});
		}

		const graph = buildGraph(travels);

		const result = findShortestPath(graph, AUTONOMY, "P0", `P${PLANETS - 1}`);

		expect(result).not.toBeNull();
		expect(result?.route[0]).toBe("P0");
		expect(result?.route.at(-1)).toBe(`P${PLANETS - 1}`);
		expect(result?.route.length ?? 0).toBeGreaterThan(PLANETS / 2);
	});
});
