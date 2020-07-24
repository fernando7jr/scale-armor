import { IncomingMessage, ServerResponse, createServer, Server as _Server } from 'http';
import { URL } from 'url';
import { Server } from './server';
import { RequestReaderBase, BeforeHook } from './request-reader';
import { Response, Method, RequestReader, RequestBody, RequestHead } from '../app';
import { parseParams } from '../app/params';
import { AddressInfo } from 'net';


class HttpRequestReader extends RequestReaderBase {
    private _head: RequestHead;
    private incomingMessage: IncomingMessage;

    constructor(req: IncomingMessage, head: RequestHead, before?: BeforeHook) {
        super(before);
        this.incomingMessage = req;
        this._head = head;
    }

    get head(): RequestHead {
        return this._head;
    }

    get hasBody(): boolean {
        return !!this._head.contentLength && !!this._head.contentType;
    }

    protected onDataChunk(encoding: string, onChunk: (chunk: string) => void): Promise<{}>;
    protected onDataChunk(onChunk: (chunk: Buffer) => void): Promise<{}>;
    protected onDataChunk(encoding: any, onChunk?: any) {
        const req = this.incomingMessage;
        if (encoding instanceof Function) {
            onChunk = encoding;
        } else {
            req.setEncoding(encoding);
        }

        return new Promise<RequestBody>((resolve, reject) => {
            req.on('data', chunk => {
                onChunk(chunk);
            });
            req.on('error', error => reject(error));
            req.on('end', () => {
                resolve();
            });
        });
    }

    protected async readBodyBuffer(): Promise<Buffer> {
        const chunks: Buffer[] = [];
        await this.onDataChunk(chunk => {
            chunks.push(chunk);
        });
        return Buffer.concat(chunks);
    }

}


export class HttpAppServer extends Server {
    private httpServer?: _Server = undefined;
    private _port: number = 0;

    protected getRequestReader(req: IncomingMessage, before?: BeforeHook): RequestReader {
        const method = req.method || '';
        const url = new URL(req.url as string, `http://${req.headers.host}`);
        const path = url.pathname;
        const params = parseParams(url.search);
        const contentEncoding = req.headers["content-encoding"];
        const contentLength = req.headers["content-length"];
        const contentType = req.headers["content-type"];
        const { appName, route } = this.getAppNameAndRoute(url);

        const head = {
            headers: req.headers,
            method: method.toLowerCase() as Method,
            params,
            route: route,
            appName: appName,
            path,
            contentEncoding,
            contentType,
            contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        };
        return new HttpRequestReader(req, head, before);
    }

    protected sendResponse(res: ServerResponse, response: Response): void {
        const statusCode = response.status.code;
        const headers = response.headers;
        const body = response.body;
        res.writeHead(statusCode, headers);
        if (body !== null && body !== undefined) {
            res.write(response.body);
        }
        res.end();
    }

    get isListening(): boolean {
        return !!this.httpServer?.listening;
    }

    get addressInfo(): AddressInfo | undefined {
        const address = this.httpServer?.address();
        if (!address) {
            return undefined;
        } else if (typeof address === 'string') {
            const url = new URL(address);
            return {
                address: url.href,
                family: 'IPv4',
                port: parseInt(url.port, 10)
            };
        }
        return address;
    }

    listen(port: number, onListening?: () => void): this {
        const before = this.getBeforeMiddleware();
        const after = this.getAfterMiddleware();
        this.httpServer = createServer(async (req, res) => {
            const requestReader = await this.getRequestReader(req, before);
            const response = await this.resolve(requestReader);
            this.sendResponse(res, after(requestReader.head, response));
        });
        this._port = port;

        if (onListening) {
            this.httpServer.once('listening', onListening);
        }

        this.httpServer.listen(port);

        return this;
    }

    async stop(): Promise<{}> {
        return await new Promise((resolve, reject) => {
            if (!this.httpServer) {
                return resolve();
            }
            this.httpServer.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}
