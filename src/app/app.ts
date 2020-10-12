import { Router, Method } from '../router';
import { RequestReader, ResponseBuilder } from './request';
import { EndpointCallback, Endpoint, EndpointsResolver, EndpointsProvider } from './endpoint';
import { TraceableError, RequestHandlingError } from './error';
import { StatusCodes } from './status';
import { StatusResponseBuilder } from './response-builder';


class _BaseApp implements EndpointsProvider {
    private router = new Router<Endpoint>();

    /**
     * Return which endpoint matches the given method and route combination
     * @param method - the method for the endpoint
     * @param path - the path for the endpoint
     * @returns the matched endpoint if there is any
     */
    protected match(method: Method, route: string): Endpoint | undefined {
        return this.router.match(method, route);
    }

    /**
     * Store an endpoint for the given method, path and callback
     * @param method - the method for the endpoint
     * @param path - the path for the endpoint
     * @param callback - the callback for the endpoint
     * @returns @this
     */
    endpoint(method: Method, route: string, callback: EndpointCallback): this;
    /**
     * Store an endpoint
     * @param endpoint - the endpoint to be used
     * @returns @this
     */
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

    /**
     * Checks if @this responds to the given combination of method and route
     * @param method - to method to test if it is present with the route
     * @param route - to route to test if it is present with the method
     * @returns true for when it responds to the given combiantion otherwise false
     */
    respondsTo(method: Method, route: string): boolean {
        return this.router.match(method, route) !== undefined;
    }

    /**
     * Get all the endpoints stored in this provider
     * @readonly
     */
    get endpoints(): readonly Endpoint[] {
        return Array.from(this.router.routes);
    }
}


/**
 * Apps are the most fundamental object in this framework
 * They store endpoints, wrapping around them handlers for errors and unexpected cases
 * They can resolve requests to endpoints and properly return the response builder
 * Apps are like micro service on their own and should be treated as such
 * What makes it even more interesting is that they work 100% standalone which makes tests really straight forward to do so.
 * @class
 * @implements EndpointsResolver
 */
export abstract class App extends _BaseApp implements EndpointsResolver {
    private _name: string;

    /**
     * @constructor
     * @param name - the name for the app
     */
    constructor(name: string) {
        super();
        this._name = name;
    }

    /** 
     * Handle the case when there is no endpoint for the request
     * @async
     * @param requestReader - the requestReader which did not resolve to any endpoint
     * @returns a promise to a response-builder
     */
    protected async resolveNotFoundEndpoint(requestReader: RequestReader): Promise<ResponseBuilder> {
        return new StatusResponseBuilder(StatusCodes.NotFound, `Could not resolve ${requestReader.head.path}`);
    }

    /**
     * Handle the case when an error occurs during request digestion
     * @async
     * @param requestReader - the requestReader which is being digested
     * @param error - the caused error
     */
    protected async resolveRequestHandlingErrorEndpoint(requestReader: RequestReader, error: TraceableError): Promise<ResponseBuilder> {
        const status = error instanceof RequestHandlingError ? error.status : StatusCodes.InternalServerError;
        const message = status.code >= 500 ? error.toString() : error.message;

        return new StatusResponseBuilder(status, message);
    }

    /**
     * Get the endpoint for the given RequestReader
     * @param requestReader - the request reader to match an endpoint
     */
    protected getEndpoint(requestReader: RequestReader): Endpoint | undefined {
        const { method, route } = requestReader.head;
        if (!route) {
            return undefined;
        }
        return this.match(method, route);
    }

    /**
     * Digest the request by calling the endpoint and return the response builder
     * @async
     * @param requestReader - the request reader
     * @param endpoint - the matched endpoint
     * @returns a promise to a ResponseBuilder
     */
    protected abstract async digestRequest(requestReader: RequestReader, endpoint: Endpoint): Promise<ResponseBuilder>;

    /**
     * Resolve the request reader to an endpoint and digest it
     * Errors and unmatched endpoints are handled automatically
     * @async
     * @param requestReader - the request reader
     * @returns a promise to a ResponseBuilder
     */
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

    /** Get the name of the EndpointsResolver */
    get name(): string {
        return this._name;
    }
}


/**
 * AppProvider are like blueprints for apps
 * Endpoints can be added and copied from any EndpointsProvider.
 * When build is called, an App instance is returned.
 * AppProvider can not be used as Apps
 * @class
 * @implements EndpointsProvider
 */
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

    /**
     * Copy the endpoints from the EndpointsProvider to the AppProvider
     * @param endpointsProvider - an EndpointsProvider
     * @returns @this
     */
    copyEndpointsFrom(endpointsProvider: EndpointsProvider): this {
        for (const endpoint of endpointsProvider.endpoints) {
            this.endpoint(endpoint);
        }
        return this;
    }

    /**
     * Build an app with the given name
     * @param name - the name for the app
     * @returns an app with the given name from the defined blueprint in this AppProvider
     */
    abstract build(name: string): App;
}
