import { createServer, Server as _Server, ServerOptions } from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { Server } from './server';
import { RequestReaderBase, BeforeHook } from './request-reader';
import { Response, Method, RequestReader, RequestBody, RequestHead } from '../app';
import { parseParams } from '../app/params';
import { AddressInfo } from 'net';


class HttpsRequestReader extends RequestReaderBase {
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

/** The options for swtting up a HttpsAppServer */
export type HttpsAppServerOptions = Partial<ServerOptions>;

/**
 * HTTPS implementation of the Server class
 * @class
 * @extends Server
 */
export class HttpsAppServer extends Server {
    private httpsServer?: _Server = undefined;
    private options: HttpsAppServerOptions = {};

    /**
     * Get a request reader for the incoming message and apply the before hooks reducer
     * @param {IncomingMessage} req - the incoming message
     * @param {function} before - the before hooks reducer
     * @returns {RequestReader} the request-reader for the incoming message
     */
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
        return new HttpsRequestReader(req, head, before);
    }

    /**
     * Send the response to the client
     * @param {ServerResponse} res - the ServerResponse object
     * @param {Response} response - the app built response
     */
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

    /**
     * Get if the server is already listening to requests
     * @abstract
     * @readonly
     * @type {boolean}
     */
    get isListening(): boolean {
        return !!this.httpsServer?.listening;
    }

    /**
     * Get the AddressInfo which the server is listening on
     * @abstract
     * @readonly
     * @returns {AddressInfo} the AddressInfo or undefined when the server is not listening yet
     */
    get addressInfo(): AddressInfo | undefined {
        const address = this.httpsServer?.address();
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

    /**
     * Load the options into the server instance
     * Should be called before starting the server
     * Certificates and other settings can be setuped here
     * @param {Object} options - the options to this server instance
     * @returns @this
     */
    loadOptions(options: HttpsAppServerOptions): this {
        this.options = Object.assign(this.options, options || {});
        return this;
    }

    /**
     * Puts the server to listen at the given port
     * If provided. The callback onListening is called when the server is ready to receive requests
     * @abstract
     * @param {number} port - the port to listen on
     * @param {callback} onListening - a callback for when the server is ready to receive requests
     */
    listen(port: number, onListening?: () => void): this {
        const before = this.getBeforeMiddleware();
        const after = this.getAfterMiddleware();
        this.httpsServer = createServer(this.options, async (req, res) => {
            const requestReader = this.getRequestReader(req, before);
            const response = await this.resolve(requestReader);
            this.sendResponse(res, after(requestReader.head, response));
        });

        if (onListening) {
            this.httpsServer.once('listening', onListening);
        }

        this.httpsServer.listen(port);

        return this;
    }

    /**
     * Stops the server from receiving any further incoming requests
     * @async
     * @abstract
     * @returns {Promise} an empty promise for when the server has completely stopped
     */
    async stop(): Promise<{}> {
        return await new Promise((resolve, reject) => {
            if (!this.httpsServer) {
                return resolve();
            }
            this.httpsServer.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}
