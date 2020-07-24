import { Router, Method } from '../router';
import { EndpointCallback, Endpoint, Request, RequestReader, JSONResponseBuilder, ResponseBuilder } from './request';
import { StatusCodes } from './status';

export type InternalServerErrorCallback = (error: Error) => Promise<ResponseBuilder>;

const notFoundEndpointCallback: EndpointCallback = () => {
    const status = StatusCodes.NotFound;
    const response = new JSONResponseBuilder({ status: status.code, message: status.name }, status);
    return Promise.resolve(response);
};

const internalServerErrorCallback = (error: Error) => {
    const status = StatusCodes.InternalServerError;
    const response = new JSONResponseBuilder({ status: status.code, message: status.name, error }, status);
    return Promise.resolve(response);
};

export class App {
    private _name: string;
    private router = new Router<Endpoint>();
    private notFoundEndpointCallback: EndpointCallback = notFoundEndpointCallback;
    private internalServerErrorCallback: InternalServerErrorCallback = internalServerErrorCallback;

    constructor(name: string) {
        this._name = name;
    }

    protected getEndpoint(requestReader: RequestReader): Endpoint | undefined {
        const { method, route, path } = requestReader.head;
        const notFoundEndpoint = {
            callback: this.notFoundEndpointCallback,
            method,
            path,
        };

        if (!route) {
            return notFoundEndpoint;
        }

        const endpoint = this.router.match(method, route);
        if (!endpoint) {
            return notFoundEndpoint;
        }
        return endpoint;
    }

    async resolve(requestReader: RequestReader) {
        const endpoint = this.getEndpoint(requestReader);
        if (!endpoint || !endpoint.callback) {
            const { method, path } = requestReader.head;
            throw new Error(`Endpoint not found for "${method}:${path}"`);
        }

        try {
            return await endpoint.callback(requestReader);
        } catch (error) {
            return await this.internalServerErrorCallback(error);
        }
    }

    add(method: Method, path: string, callback: EndpointCallback): this;
    add(endpoint: Endpoint): this;
    add(arg1: Method | Endpoint, path?: string, callback?: EndpointCallback): this {
        if (path && callback) {
            return this.add({
                method: arg1 as Method,
                path,
                callback
            });
        }

        const endpoint = arg1 as Endpoint;
        this.router.add(endpoint);
        return this;
    }

    setNotFoundEndpoint(endpoint?: Pick<Endpoint, 'callback'>): this {
        if (!endpoint) {
            this.notFoundEndpointCallback = notFoundEndpointCallback;
        } else {
            this.notFoundEndpointCallback = endpoint.callback;
        }

        return this;
    }

    setInternalServerErrorCallback(callback?: InternalServerErrorCallback): this {
        if (!callback) {
            this.internalServerErrorCallback = internalServerErrorCallback;
        } else {
            this.internalServerErrorCallback = callback;
        }

        return this;
    }

    get endpoints(): readonly Endpoint[] {
        return Array.from(this.router.routes);
    }

    get name(): string {
        return this._name;
    }
}
