import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/test-app.js";

describe("OpenAPI documentation", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = buildTestApp();
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("exposes a valid OpenAPI 3.x spec via app.swagger()", () => {
		const spec = app.swagger() as {
			openapi: string;
			info: { title: string };
			paths: Record<string, { post?: unknown; get?: unknown }>;
		};

		expect(spec.openapi).toMatch(/^3\./);
		expect(spec.info.title).toBe("Millennium Falcon API");
		expect(spec.paths["/compute"]?.post).toBeDefined();
	});

	it("serves the Swagger UI HTML at /docs/", async () => {
		const res = await app.inject({ method: "GET", url: "/docs/" });

		expect(res.statusCode).toBe(200);
		expect(res.headers["content-type"]).toMatch(/html/);
	});
});
