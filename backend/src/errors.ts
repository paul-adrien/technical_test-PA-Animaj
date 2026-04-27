/**
 * Base class for errors that should map to a structured HTTP response.
 * The global error handler in `app.ts` checks `instanceof HttpError` to format
 * the response uniformly.
 */
export class HttpError extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "HttpError";
	}
}

/**
 * Thrown by the /compute handler when no path exists between the configured
 * departure and the requested arrival (or when arrival is unknown).
 */
export class NoRouteError extends HttpError {
	constructor(arrival: string) {
		super(404, "NO_ROUTE", `No route to ${arrival}`);
		this.name = "NoRouteError";
	}
}
