import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildGraph } from "../../src/domain/graph.js";
import { buildTestApp } from "../helpers/test-app.js";

describe("POST /compute — README example graph", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		const graph = buildGraph([
			{ origin: "Tatooine", destination: "Dagobah", travelTime: 6 },
			{ origin: "Dagobah", destination: "Endor", travelTime: 4 },
			{ origin: "Dagobah", destination: "Hoth", travelTime: 1 },
			{ origin: "Hoth", destination: "Endor", travelTime: 1 },
			{ origin: "Tatooine", destination: "Hoth", travelTime: 6 },
		]);
		app = buildTestApp({ graph });
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns the README answer for arrival=Endor", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: { arrival: "Endor" },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({
			duration: 8,
			route: ["Tatooine", "Hoth", "Endor"],
		});
	});

	it("returns duration 0 with single-planet route when arrival equals departure", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: { arrival: "Tatooine" },
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ duration: 0, route: ["Tatooine"] });
	});

	it("returns 404 NO_ROUTE when arrival is not in the graph", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: { arrival: "Coruscant" },
		});

		expect(res.statusCode).toBe(404);
		expect(res.json()).toEqual({
			error: { code: "NO_ROUTE", message: "No route to Coruscant" },
		});
	});
});

describe("POST /compute — body validation", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = buildTestApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns 400 INVALID_BODY when arrival is missing", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: {},
		});

		expect(res.statusCode).toBe(400);
		expect(res.json().error.code).toBe("INVALID_BODY");
	});

	it("returns 400 INVALID_BODY when arrival is empty", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: { arrival: "" },
		});

		expect(res.statusCode).toBe(400);
		expect(res.json().error.code).toBe("INVALID_BODY");
	});

	it("returns 400 INVALID_BODY when arrival is not a string", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			payload: { arrival: 42 },
		});

		expect(res.statusCode).toBe(400);
		expect(res.json().error.code).toBe("INVALID_BODY");
	});

	it("returns 400 when the JSON body is malformed", async () => {
		const res = await app.inject({
			method: "POST",
			url: "/compute",
			headers: { "content-type": "application/json" },
			payload: "{ not json",
		});

		expect(res.statusCode).toBe(400);
		expect(res.json().error.code).toBe("INVALID_BODY");
	});
});
