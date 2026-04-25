import { pino } from "pino";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { assertPlanetExists, buildGraph } from "./domain/graph.js";
import { loadTravels } from "./repository/travels.js";

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

const configPath = process.argv[2] ?? process.env.CONFIG_PATH;
if (!configPath) {
	logger.error(
		"missing config path: pass it as CLI arg or set CONFIG_PATH env var",
	);
	process.exit(1);
}

let config: ReturnType<typeof loadConfig>;
try {
	config = loadConfig(configPath);
} catch (err) {
	logger.error({ err }, "failed to load config");
	process.exit(1);
}

logger.info(
	{
		autonomy: config.autonomy,
		departure: config.departure,
		routesDbPath: config.routesDbPath,
	},
	"config loaded",
);

let graph: ReturnType<typeof buildGraph>;
try {
	const travels = loadTravels(config.routesDbPath);
	graph = buildGraph(travels);
	assertPlanetExists(graph, config.departure);
	logger.info(
		{ travels: travels.length, planets: graph.size },
		"routes graph built",
	);
} catch (err) {
	logger.error({ err }, "failed to build routes graph");
	process.exit(1);
}

const app = buildApp({ loggerInstance: logger, config, graph });

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
