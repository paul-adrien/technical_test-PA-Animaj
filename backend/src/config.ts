import { readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { type Config, configSchema } from "./schemas/config.js";

export type LoadedConfig = Config & {
	/** Absolute path to the SQLite routes database, resolved relative to the config file. */
	routesDbPath: string;
};

export function loadConfig(configPath: string): LoadedConfig {
	const absoluteConfigPath = resolve(configPath);

	let raw: string;
	try {
		raw = readFileSync(absoluteConfigPath, "utf-8");
	} catch (err) {
		throw new Error(`Cannot read config file: ${absoluteConfigPath}`, {
			cause: err,
		});
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		throw new Error(`Invalid JSON in config file: ${absoluteConfigPath}`, {
			cause: err,
		});
	}

	const result = configSchema.safeParse(parsed);
	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
			.join("\n");
		throw new Error(`Invalid config in ${absoluteConfigPath}:\n${issues}`);
	}

	const config = result.data;
	const routesDbPath = isAbsolute(config.routes_db)
		? config.routes_db
		: resolve(dirname(absoluteConfigPath), config.routes_db);

	return { ...config, routesDbPath };
}
