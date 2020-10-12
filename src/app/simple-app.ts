import { RequestReader, ResponseBuilder } from './request';
import { EndpointCallback, Endpoint } from './endpoint';
import { App, AppProvider } from './app';
import { TraceableError } from './error';


/**
 * A simple implementation of an App
 * Can be used as-is or extended.
 * @class
 * @extends App
 */
export class SimpleApp extends App {
    private notFoundEndpointCallback?: EndpointCallback;
    private requestHandlingErrorCallback?: (requestReader: RequestReader, error: TraceableError) => Promise<ResponseBuilder>;

    /**
     * @constructor
     * @param {string} name - the name for the app
     */
    constructor(name: string) {
        super(name);
    }

    /** 
     * Handle the case when there is no endpoint for the request
     * The custom handler is used if it is set
     * @async
     * @param {RequestReader} requestReader - the requestReader which did not resolve to any endpoint
     * @returns {Promise} a promise to a response-builder
     */
    protected async resolveNotFoundEndpoint(requestReader: RequestReader): Promise<ResponseBuilder> {
        if (this.notFoundEndpointCallback) {
            return await this.notFoundEndpointCallback(requestReader);
        }
        return super.resolveNotFoundEndpoint(requestReader);
    }

    /**
     * Handle the case when an error occurs during request digestion
     * * The custom handler is used if it is set
     * @async
     * @param {RequestReader} requestReader - the requestReader which is being digested
     * @param {TraceableError} error - the caused error
     * @returns {Promise}
     */
    protected async resolveRequestHandlingErrorEndpoint(requestReader: RequestReader, error: TraceableError): Promise<ResponseBuilder> {
        if (this.requestHandlingErrorCallback) {
            return await this.requestHandlingErrorCallback(requestReader, error);
        }
        return super.resolveRequestHandlingErrorEndpoint(requestReader, error);
    }

    /**
     * Get the endpoint for the given RequestReader
     * @async
     * @param {RequestReader} requestReader - the request reader to match an endpoint
     * @returns {Promise}
     */
    protected async digestRequest(requestReader: RequestReader, endpoint: Endpoint): Promise<ResponseBuilder> {
        return endpoint.callback(requestReader);
    }

    /**
     * Set a custom handler for when there is no endpoint for the request
     * @param {function} callback - the endpoint callback
     * @return @this
     */
    setNotFoundCallback(callback?: EndpointCallback): this;
    /**
     * Set a custom handler for when there is no endpoint for the request
     * @param {Endpoiny} endpoint - an endpoint like object containing the callback
     * @return @this
     */
    setNotFoundCallback(endpoint?: Pick<Endpoint, 'callback'>): this;
    setNotFoundCallback(arg?: Pick<Endpoint, 'callback'> | EndpointCallback): this {
        if (!arg) {
            this.notFoundEndpointCallback = undefined;
        } else {
            this.notFoundEndpointCallback = arg instanceof Function ? arg : arg.callback;
        }

        return this;
    }

    /**
     * Set a custom handler for when there is an error during request digestion
     * @param {function} callback - the endpoint callback
     * @return @this
     */
    setRequesthandlingErrorCallback(callback?: (requestReader: RequestReader, error: TraceableError) => Promise<ResponseBuilder>): this {
        this.requestHandlingErrorCallback = callback;

        return this;
    }
}

/**
 * An app-provider for simple-apps
 * @class
 * @extends AppProvider
 */
export class SimpleAppProvider extends AppProvider {
    /**
     * Build an app with the given name
     * @param {string} name - the name for the app
     * @returns {App} an app with the given name from the defined blueprint in this AppProvider
     */
    build(name: string): App {
        const app = new SimpleApp(name);
        this.copyEndpointsTo(app);
        return app;
    }
}
