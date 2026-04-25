import Database from "better-sqlite3";

/**
 * Opens the SQLite database in read-only mode.
 * The backend never writes to the routes database — opening read-only protects
 * against accidental writes and lets SQLite skip the journal file.
 */
export function openReadOnlyDatabase(path: string): Database.Database {
	try {
		return new Database(path, { readonly: true, fileMustExist: true });
	} catch (err) {
		throw new Error(`Cannot open SQLite database: ${path}`, { cause: err });
	}
}
