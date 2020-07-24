import { Route, Method } from '../router';
import { StatusCode } from './status';
import { Params } from './params';

export { Method } from '../router';
export { Params, ParamsPrimitives } from './params';

export type Headers = NodeJS.Dict<string | string[]>;
export interface RequestHead {
    readonly appName?: string;
    readonly method: Method;
    readonly path: string;
    readonly route?: string;
    readonly headers: Headers;
    readonly params: Params;
    readonly contentType?: 'application/json' | string;
    readonly contentLength?: number;
    readonly contentEncoding?: string;
}
export interface RequestBody<T = unknown> {
    readonly body?: Buffer;
    // readonly data?: Buffer;
    readonly text?: string;
    readonly json?: T;
    readonly form?: T;
}
export interface Request<T = any> extends RequestHead, RequestBody<T> {
}

export interface Response {
    contentType?: string;
    headers: Headers;
    body?: string | Buffer;
    status: StatusCode;
}

export type EndpointCallback = (requestReader: RequestReader) => Promise<ResponseBuilder>;
export interface Endpoint extends Route {
    callback: EndpointCallback;
}

export class CommonResponseBuilder implements ResponseBuilder {
    protected _headers: Headers;
    protected _contentType: string;
    protected _body: any;
    protected _status: StatusCode;

    constructor(response: {
        headers?: Headers,
        contentType?: string,
        body?: any,
        status: StatusCode;
    }) {
        this._headers = response.headers || {};
        this._contentType = response.contentType || 'text/html';
        this._body = response.body;
        this._status = response.status;
    }

    get contentType(): string {
        return this._contentType;
    }

    get headers(): Headers {
        return this._headers;
    }

    get status(): StatusCode {
        return this._status;
    }

    protected get body(): any {
        return this._body;
    }

    build(): Response {
        const body = this.body;
        return {
            contentType: this.contentType,
            headers: this.headers,
            status: this.status,
            body: this.body
        };
    }
}

export class StatusResponseBuilder extends CommonResponseBuilder {
    constructor(status: StatusCode) {
        super({
            contentType: 'text/plain',
            body: status.name,
            status,
        });
    }

    protected get body(): any {
        const body = super.body;
        if (body === undefined) {
            return undefined;
        }
        return JSON.stringify(body);
    }
}

export class JSONResponseBuilder extends CommonResponseBuilder {
    constructor(body: any, status: StatusCode, headers?: Headers) {
        super({
            headers,
            body,
            status,
            contentType: 'application/json'
        });
    }

    protected get body(): any {
        const body = super.body;
        if (body === undefined) {
            return undefined;
        }
        return JSON.stringify(body);
    }
}

export interface RequestReader {
    readonly head: RequestHead;
    readonly hasBody: boolean;

    read(): Promise<Request>;
    stream(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    stream(onChunk: (chunk: Buffer) => void): Promise<{}>;
}

export interface ResponseBuilder {
    readonly status: StatusCode;
    readonly headers: Headers;
    readonly contentType?: string;
    build(): Response;
}
