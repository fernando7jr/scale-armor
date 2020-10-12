import { Route } from '../router/router';
import { Method } from '../router';
import { RequestReader, ResponseBuilder } from './request';

/** Defines the callback structure for an endpoint */
export type EndpointCallback = (requestReader: RequestReader) => Promise<ResponseBuilder>;
/** Defines the structure for an endpoint */
export interface Endpoint extends Route {
    callback: EndpointCallback;
}

/**
 * EndpointsProviders are objects which can store endpoints
 * They are one of the main parts of the Apps.
 */
export interface EndpointsProvider {
    /**
     * Store an endpoint for the given method, path and callback
     * @param method - the method for the endpoint
     * @param path - the path for the endpoint
     * @param callback - the callback for the endpoint
     * @returns @this
     */
    endpoint(method: Method, path: string, callback: EndpointCallback): this;
    /**
     * Store an endpoint
     * @param endpoint - the endpoint to be used
     * @returns @this
     */
    endpoint(endpoint: Endpoint): this;

    /**
     * Checks if @this responds to the given combination of method and route
     * @param method - to method to test if it is present with the route
     * @param route - to route to test if it is present with the method
     * @returns true for when it responds to the given combiantion otherwise false
     */
    respondsTo(method: Method, route: string): boolean;

    /**
     * Get all the endpoints stored in this provider
     * @readonly
     */
    readonly endpoints: readonly Endpoint[];
}

/**
 * EndpointsResolver are a super-set of EndpointsProvider which can also resolve requests to endpoints
 */
export interface EndpointsResolver extends EndpointsProvider {
    /**
     * Resolve the request to one of it is endpoints.
     * Absence of an endpoint, error handling and the actual resolution depends on how it is implemented
     * @param requestReader - A RequestReader to be resolved
     * @returns a promise to a ResponseBuilder
     */
    resolve(requestReader: RequestReader): Promise<ResponseBuilder>;

    /** Get the name of the EndpointsResolver */
    readonly name: string;
}
