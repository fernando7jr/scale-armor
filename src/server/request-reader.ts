import { URLSearchParams } from 'url';
import { RequestReader, Request, RequestHead, RequestBody } from '../app/request';


type Callback<T> = (t: T) => void;
/** 
 * BeforeHook callback
 * It is executed when reading the request
 */
export type BeforeHook = (request: Request) => Request;

/**
 * Base class for RequestReader
 * @class
 * @abstract
 * @implements RequestReader
 */
export abstract class RequestReaderBase implements RequestReader {
    /**
     * @constructor
     * @param {function} before - before hook reducer
     */
    constructor(private before?: BeforeHook) { }

    /**
     * Get the heading of the request
     * @abstract
     * @readonly
     * @type {RequestHead}
     */
    abstract get head(): RequestHead;
    /**
     * Check if the request has a body
     * @abstract
     * @readonly
     * @type {boolean}
     */
    abstract get hasBody(): boolean;

    protected abstract onDataChunk(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    protected abstract onDataChunk(onChunk: (chunk: Buffer) => void): Promise<{}>;
    protected abstract readBodyBuffer(): Promise<Buffer>;

    /**
     * Choose the body type according to the content-type and return a callback to it
     * @param {string} contentType - the content-type form the request
     * @param {string} encoding - the encoding of the content-type if present
     * @returns {function} a callback to build the response body
     */
    private getBodyParser<T = unknown>(contentType: string, encoding?: BufferEncoding): (data: Buffer) => RequestBody<T> {
        switch (contentType) {
            case 'application/json':
                return (data: Buffer) => {
                    return {
                        body: data,
                        json: JSON.parse(data.toString(encoding))
                    };
                };
            case 'application/x-www-form-urlencoded':
                return (data: Buffer) => {
                    const qs = new URLSearchParams(data.toString(encoding));
                    const form: any = {};
                    for (const key of qs.keys()) {
                        form[key] = qs.get(key);
                    }
                    return {
                        body: data,
                        form
                    };
                };
        }
        if (contentType.startsWith('text/')) {
            return (data: Buffer) => {
                return {
                    body: data,
                    text: data.toString(encoding)
                };
            };
        }
        return (data: Buffer) => {
            return {
                body: data
            };
        };
    }

    /**
     * Read the body
     * @template T defaults unknown - the interface to the body content if it is applicable
     * @async
     * @returns {Promise} a promise to the request body
     */
    protected async readBody<T = unknown>(): Promise<RequestBody<T>> {
        const head = this.head;
        const contentType = head.contentType;
        const contentLength = head.contentLength;
        const contentEncoding = head.contentEncoding;
        if (!contentLength || !contentType) {
            return {};
        }
        const parser = this.getBodyParser<T>(contentType, contentEncoding as BufferEncoding);
        const data = await this.readBodyBuffer();

        return parser(data);
    }

    /**
     * Read the body and return the Request object
     * Before hooks are executed on the request automatically
     * @template T defaults unknown - the interface to the body content if it is applicable
     * @async
     * @returns {Promise} a promise to the request
     */
    async read<T = unknown>(): Promise<Request<T>> {
        const requestHead = this.head;
        const requestBody = await this.readBody();
        const request: Request = {
            headers: requestHead.headers || {},
            method: requestHead.method,
            params: requestHead.params || {},
            path: requestHead.path,
            route: requestHead.route,
            appName: requestHead.appName,
            body: requestBody.body,
            json: requestBody.json,
            form: requestBody.form,
            contentType: requestHead.contentType,
            contentEncoding: requestHead.contentEncoding,
            contentLength: requestHead.contentLength
        };

        if (this.before) {
            return this.before(request);
        }

        return request;
    }

    /** 
     * Stream the body in chunks using the defined enconding.
     * Good for reading files or huge amount of data.
     * The chunks will be converted to a string instead of a Buffer object.
     * @param {string} encoding - the encoding of the content
     * @param {string} onChunk - the callback to process each chunk
     * @returns {Promise} an promise of empty for when all chunks were read
     */
    stream(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    /** 
     * Stream the body in chunks using the defined enconding.
     * Good for reading files or huge amount of data.
     * @param {function} onChunk - the callback to process each chunk
     * @returns {Promise} an promise of empty for when all chunks were read
     */
    stream(onChunk: (chunk: Buffer) => void): Promise<{}>;
    stream(encoding: string | Callback<Buffer>, onChunk?: Callback<string>): Promise<{}> {
        if (encoding instanceof Function) {
            return this.onDataChunk(encoding);
        } else if (onChunk != undefined) {
            return this.onDataChunk(encoding, onChunk);
        }
        return Promise.resolve({});
    }
}
