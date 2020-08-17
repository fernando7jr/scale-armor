import { URLSearchParams } from 'url';
import { RequestReader, Request, Params, RequestHead, RequestBody } from '../app/request';

type Callback<T> = (t: T) => void;
export type BeforeHook = (request: Request) => Request;
export abstract class RequestReaderBase implements RequestReader {
    constructor(private before?: BeforeHook) { }

    abstract get head(): RequestHead;
    abstract get hasBody(): boolean;

    protected abstract onDataChunk(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    protected abstract onDataChunk(onChunk: (chunk: Buffer) => void): Promise<{}>;
    protected abstract readBodyBuffer(): Promise<Buffer>;

    private getBodyParser<T = unknown>(contentType: String, encoding?: BufferEncoding): (data: Buffer) => RequestBody<T> {
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

    stream(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
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
