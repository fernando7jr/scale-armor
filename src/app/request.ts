import { Method } from '../router/methods';
import { StatusCode } from './status';
import { Params } from './params';

export { Method } from '../router/methods';
export { Params, ParamsPrimitives } from './params';

/** The Headers dictionary of a request */
export type Headers = NodeJS.Dict<string | string[]>;
/** The Head of a request */
export interface RequestHead {
    /** The name of the routed app */
    readonly appName?: string;
    /** The Http method of the request */
    readonly method: Method;
    /** The original path of the request */
    readonly path: string;
    /** The matched route in the app. It may sightly differ from the path. */
    readonly route?: string;
    /** The headers dictionary */
    readonly headers: Headers;
    /** The params object */
    readonly params: Params;
    /** The content-type if there is any in the headers */
    readonly contentType?: 'application/json' | string;
    /** The content-length if there is any in the headers */
    readonly contentLength?: number;
    /** The content-encoding if there is any in the headers */
    readonly contentEncoding?: string;
}
/** The Request body for when it is present */
export interface RequestBody<T = unknown> {
    /** The raw buffer for the body content */
    readonly body?: Buffer;
    /** The raw string for the body content */
    readonly text?: string;
    /** The json decoded body content for when the content-type is 'application/json' */
    readonly json?: T;
    /** The json decoded body content for when the content-type is eigther 'application/x-www-form-urlencoded' or 'multipart/form-data' */
    readonly form?: T;
}
/** The Request interface */
export interface Request<T = any> extends RequestHead, RequestBody<T> {
}

/** The Response interface */
export interface Response {
    /** The content-type if a body is present */
    contentType?: string;
    /** The response headers dict */
    headers: Headers;
    /** The body when present */
    body?: string | Buffer;
    /** The status code of the response */
    status: StatusCode;
}

/**
 * The interface for a request-reader
 * Allow read the request body when needed only and can stream it in chunks
 */
export interface RequestReader {
    /** Get the heading of the request. Does not need to await */
    readonly head: RequestHead;
    /** Checks if a body is present */
    readonly hasBody: boolean;

    /**
     * Read the body and return a whole Request object (heading + body).
     * @async
     * @returns a promise to the request
     */
    read(): Promise<Request>;

    /** 
     * Stream the body in chunks using the defined enconding.
     * Good for reading files or huge amount of data.
     * The chunks will be converted to a string instead of a Buffer object.
     * @param encoding - the encoding of the content
     * @param onChunk - the callback to process each chunk
     * @returns an promise of empty for when all chunks were read
     */
    stream(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    /** 
     * Stream the body in chunks using the defined enconding.
     * Good for reading files or huge amount of data.
     * @param onChunk - the callback to process each chunk
     * @returns an promise of empty for when all chunks were read
     */
    stream(onChunk: (chunk: Buffer) => void): Promise<{}>;
}

/** 
 * The interface for a response-builder.
 * ResponseBuilder should be used instead of directly building the response yourself.
 */
export interface ResponseBuilder {
    /** Get the status code */
    readonly status: StatusCode;
    /** Get the headers dict */
    readonly headers: Headers;
    /** Get the content-type of the answer if it is set */
    readonly contentType?: string;
    /**
     * Build the Response object from the given data
     * @returns a Response object read to be sent as answer to the request
     */
    build(): Response;
}
