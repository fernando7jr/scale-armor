import { Method } from '../router/methods';
import { StatusCode } from './status';
import { Params } from './params';

export { Method } from '../router/methods';
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
