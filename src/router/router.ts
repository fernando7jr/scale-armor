import { Method } from './methods';

export interface Route {
    method: Method;
    path: string;
}

export class Router<T extends Route = Route> {
    private __routes: Map<string, T> = new Map();

    add(endpoint: T): void {
        const key = `${endpoint.method}:${endpoint.path}`;
        this.__routes.set(key, endpoint);
    }

    match(method: Method, path: string) {
        const key = `${method}:${path}`;
        return this.__routes.get(key);
    }

    get routes() {
        return this.__routes.values();
    }

    get size(): number {
        return this.__routes.size;
    }
}
