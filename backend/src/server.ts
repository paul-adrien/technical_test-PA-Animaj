import { pino } from "pino";
import { buildApp } from "./app.js";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
	level: process.env.LOG_LEVEL ?? "info",
	...(isDev && {
		transport: {
			target: "pino-pretty",
			options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" },
		},
	}),
});

const app = buildApp({ loggerInstance: logger });

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const shutdown = async (signal: string): Promise<void> => {
	logger.info({ signal }, "received signal, shutting down");
	try {
		await app.close();
		process.exit(0);
	} catch (err) {
		logger.error({ err }, "error during shutdown");
		process.exit(1);
	}
};

process.on("SIGINT", () => {
	void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
	void shutdown("SIGTERM");
});

try {
	await app.listen({ port, host });
} catch (err) {
	logger.error({ err }, "failed to start server");
	process.exit(1);
}
