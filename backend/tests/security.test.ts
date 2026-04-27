import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTestApp } from "./helpers/test-app.js";

/**
 * Each test builds a fresh app instance because we tweak env vars
 * (CORS_ORIGIN / RATE_LIMIT_MAX) before construction.
 */
async function withApp<T>(
	fn: (app: FastifyInstance) => Promise<T>,
): Promise<T> {
	const app = buildTestApp();
	await app.ready();
	try {
		return await fn(app);
	} finally {
		await app.close();
	}
}

describe("Security middleware", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("CORS", () => {
		it("answers preflight requests with Access-Control-Allow-Origin", async () => {
			await withApp(async (app) => {
				const res = await app.inject({
					method: "OPTIONS",
					url: "/compute",
					headers: {
						origin: "https://example.com",
						"access-control-request-method": "POST",
						"access-control-request-headers": "content-type",
					},
				});

				expect(res.statusCode).toBeLessThan(300);
				expect(res.headers["access-control-allow-origin"]).toBeDefined();
			});
		});

		it("does not echo a disallowed origin when CORS_ORIGIN is restrictive", async () => {
			vi.stubEnv("CORS_ORIGIN", "https://allowed.example.com");

			await withApp(async (app) => {
				const res = await app.inject({
					method: "OPTIONS",
					url: "/compute",
					headers: {
						origin: "https://attacker.example.com",
						"access-control-request-method": "POST",
					},
				});

				expect(res.headers["access-control-allow-origin"]).not.toBe(
					"https://attacker.example.com",
				);
			});
		});
	});

	describe("Rate limiting", () => {
		it("exposes x-ratelimit headers on successful responses", async () => {
			await withApp(async (app) => {
				const res = await app.inject({ method: "GET", url: "/health" });

				expect(res.statusCode).toBe(200);
				expect(res.headers["x-ratelimit-limit"]).toBeDefined();
				expect(res.headers["x-ratelimit-remaining"]).toBeDefined();
			});
		});

		it("returns 429 RATE_LIMITED once the per-IP limit is exceeded", async () => {
			vi.stubEnv("RATE_LIMIT_MAX", "2");

			await withApp(async (app) => {
				// First two requests fit within the limit.
				await app.inject({ method: "GET", url: "/health" });
				await app.inject({ method: "GET", url: "/health" });

				// Third one is over the limit.
				const res = await app.inject({ method: "GET", url: "/health" });
				expect(res.statusCode).toBe(429);

				const body = res.json() as {
					error: { code: string; message: string };
				};
				expect(body.error.code).toBe("RATE_LIMITED");
			});
		});
	});
});
