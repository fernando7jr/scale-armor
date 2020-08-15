import { Route } from '../router/router';
import { Method } from '../router';
import { RequestReader, ResponseBuilder } from './request';

export type EndpointCallback = (requestReader: RequestReader) => Promise<ResponseBuilder>;
export interface Endpoint extends Route {
    callback: EndpointCallback;
}

export interface EndpointsProvider {
    endpoint(method: Method, path: string, callback: EndpointCallback): this;
    endpoint(endpoint: Endpoint): this;

    readonly endpoints: readonly Endpoint[];
}

export interface EndpointsResolver extends EndpointsProvider {
    resolve(requestReader: RequestReader): Promise<ResponseBuilder>;

    readonly name: string;
}
