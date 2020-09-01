import { RequestReader, ResponseBuilder } from './request';
import { EndpointCallback, Endpoint } from './endpoint';
import { App, AppProvider } from './app';
import { TraceableError } from './error';


export class SimpleApp extends App {
    private notFoundEndpointCallback?: EndpointCallback;
    private requestHandlingErrorCallback?: (requestReader: RequestReader, error: TraceableError) => Promise<ResponseBuilder>;

    constructor(name: string) {
        super(name);
    }

    protected async resolveNotFoundEndpoint(requestReader: RequestReader): Promise<ResponseBuilder> {
        if (this.notFoundEndpointCallback) {
            return await this.notFoundEndpointCallback(requestReader);
        }
        return super.resolveNotFoundEndpoint(requestReader);
    }

    protected async resolveRequestHandlingErrorEndpoint(requestReader: RequestReader, error: TraceableError): Promise<ResponseBuilder> {
        if (this.requestHandlingErrorCallback) {
            return await this.requestHandlingErrorCallback(requestReader, error);
        }
        return super.resolveRequestHandlingErrorEndpoint(requestReader, error);
    }

    protected async digestRequest(requestReader: RequestReader, endpoint: Endpoint): Promise<ResponseBuilder> {
        return endpoint.callback(requestReader);
    }

    setNotFoundCallback(callback?: EndpointCallback): this;
    setNotFoundCallback(endpoint?: Pick<Endpoint, 'callback'>): this;
    setNotFoundCallback(arg?: Pick<Endpoint, 'callback'> | EndpointCallback): this {
        if (!arg) {
            this.notFoundEndpointCallback = undefined;
        } else {
            this.notFoundEndpointCallback = arg instanceof Function ? arg : arg.callback;
        }

        return this;
    }

    setRequesthandlingErrorCallback(callback?: (requestReader: RequestReader, error: TraceableError) => Promise<ResponseBuilder>): this {
        this.requestHandlingErrorCallback = callback;

        return this;
    }
}

export class SimpleAppProvider extends AppProvider {
    build(name: string): App {
        const app = new SimpleApp(name);
        this.copyEndpoints(app);
        return app;
    }
}
