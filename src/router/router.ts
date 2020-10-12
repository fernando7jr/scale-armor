import { Method } from './methods';

/** The interace for routes */
export interface Route {
    method: Method;
    route: string;
}

/**
 * A basic implementation of a hash-map based router
 * @class
 * @template T extends Route
 */
export class Router<T extends Route = Route> {
    private __routes: Map<string, T> = new Map();

    /**
     * Add an endpoint to the router
     * @param endpoint - the endpoint with the route
     */
    add(endpoint: T): void {
        const key = `${endpoint.method}:${endpoint.route}`;
        this.__routes.set(key, endpoint);
    }

    /**
     * Return which route matches the given method and path combination
     * @param method
     * @param path
     * @returns the matched route if there is any
     */
    match(method: Method, path: string) {
        const key = `${method}:${path}`;
        return this.__routes.get(key);
    }

    /** Get the available routes */
    get routes() {
        return this.__routes.values();
    }

    /** Get how many routes are stored in the router */
    get size(): number {
        return this.__routes.size;
    }
}
