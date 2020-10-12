import { Router, Method } from '../router';
import { RequestReader, ResponseBuilder } from './request';
import { EndpointCallback, Endpoint, EndpointsResolver, EndpointsProvider } from './endpoint';
import { TraceableError, RequestHandlingError } from './error';
import { StatusCodes } from './status';
import { StatusResponseBuilder } from './response-builder';


class _BaseApp implements EndpointsProvider {
    private router = new Router<Endpoint>();

    protected match(method: Method, route: string): Endpoint | undefined {
        return this.router.match(method, route);
    }

    endpoint(method: Method, route: string, callback: EndpointCallback): this;
    endpoint(endpoint: Endpoint): this;
    endpoint(arg1: Method | Endpoint, route?: string, callback?: EndpointCallback): this {
        if (route && callback) {
            return this.endpoint({
                method: arg1 as Method,
                route,
                callback
            });
        }

        const endpoint = arg1 as Endpoint;
        this.router.add(endpoint);
        return this;
    }

    respondsTo(method: Method, route: string): boolean {
        return this.router.match(method, route) !== undefined;
    }

    get endpoints(): readonly Endpoint[] {
        return Array.from(this.router.routes);
    }
}


export abstract class App extends _BaseApp implements EndpointsResolver {
    private _name: string;

    constructor(name: string) {
        super();
        this._name = name;
    }

    protected async resolveNotFoundEndpoint(requestReader: RequestReader): Promise<ResponseBuilder> {
        return new StatusResponseBuilder(StatusCodes.NotFound, `Could not resolve ${requestReader.head.path}`);
    }

    protected async resolveRequestHandlingErrorEndpoint(requestReader: RequestReader, error: TraceableError): Promise<ResponseBuilder> {
        const status = error instanceof RequestHandlingError ? error.status : StatusCodes.InternalServerError;
        const message = status.code >= 500 ? error.toString() : error.message;

        return new StatusResponseBuilder(status, message);
    }

    protected getEndpoint(requestReader: RequestReader): Endpoint | undefined {
        const { method, route } = requestReader.head;
        if (!route) {
            return undefined;
        }
        return this.match(method, route);
    }

    protected abstract async digestRequest(requestReader: RequestReader, endpoint: Endpoint): Promise<ResponseBuilder>;

    async resolve(requestReader: RequestReader): Promise<ResponseBuilder> {
        const endpoint = this.getEndpoint(requestReader);

        try {
            if (!endpoint) {
                return await this.resolveNotFoundEndpoint(requestReader);
            }
            return await this.digestRequest(requestReader, endpoint);
        } catch (error) {
            if (!(error instanceof TraceableError)) {
                error = new TraceableError('Error during request digestion.', error);
            }
            return await this.resolveRequestHandlingErrorEndpoint(requestReader, error);
        }
    }

    get name(): string {
        return this._name;
    }
}

export abstract class AppProvider extends _BaseApp {
    /**
     * Copy the endpoints from the blueprint to the EndpointsProvider
     * @param endpointsProvider - an EndpointsProvider
     */
    protected copyEndpointsTo(endpointsProvider: EndpointsProvider): void {
        for (const endpoint of this.endpoints) {
            endpointsProvider.endpoint(endpoint);
        }
    }

    abstract build(name: string): App;
}
