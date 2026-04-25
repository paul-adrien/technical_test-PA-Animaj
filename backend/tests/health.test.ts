import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/test-app.js";

describe("GET /health", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = buildTestApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("returns 200 with ok status", async () => {
		const res = await app.inject({ method: "GET", url: "/health" });

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ status: "ok" });
	});
});
