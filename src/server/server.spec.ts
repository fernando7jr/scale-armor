import { expect } from 'chai';
import httpClient from 'http';
import { App, RequestReader, JSONResponseBuilder, RequestHead, RequestBody, Method, ResponseBuilder, Headers } from '../app';
import { StatusCodes } from '../app/status';
import { Server } from './server';


class FakeServer extends Server {
    private _port = 0;
    private _isListening = false;

    listen(port: number, onListening?: (() => void) | undefined): this {
        if (port < 1) {
            port = Math.floor(Math.random() * 10000);
        }
        this._port = port;

        this._isListening = true;
        if (onListening) {
            onListening();
        }

        return this;
    }

    stop(): Promise<{}> {
        this._isListening = false;
        return Promise.resolve({});
    }

    get isListening(): boolean {
        return this._isListening;
    }

    get addressInfo(): import("net").AddressInfo | undefined {
        return {
            address: '::',
            family: 'IPv4',
            port: this._port
        };
    }

}


describe(Server.name, () => {
    let server: Server;

    const createFakeApp = (name: string) => {
        return new class extends App { }(name);
    };
    const createFakeRequestReader = (head: Partial<RequestHead>, body?: Partial<RequestBody>) => {
        const path = head.path || ((head.appName || '') + (head.route || ''));
        const fakeRequestreader: Partial<RequestReader> = {
            hasBody: !!body,
            head: Object.assign({}, head, { path }) as RequestHead,
            read() {
                const request = Object.assign({}, head as RequestHead, body as RequestBody);
                return Promise.resolve(request);
            }
        };

        return fakeRequestreader as RequestReader;
    };

    const awaitListening = async (port?: number) => {
        return new Promise(resolve => {
            server.listen(port || 0, () => {
                resolve();
            });
        });
    };

    beforeEach(() => {
        server = new FakeServer();
    });

    afterEach(async () => {
        if (server.isListening) {
            await server.stop();
        }
    });

    it('should add apps', () => {
        const apps = [
            createFakeApp('/app'),
            createFakeApp('/test'),
            createFakeApp('/test2'),
            createFakeApp('test3'),
            createFakeApp('214test2')
        ];

        apps.forEach(app => {
            server.app(app);
        });
        apps.forEach(app => {
            expect(server.containsApp(app)).to.be.true;
        });
    });

    it('should resolve incoming requests', async () => {
        const app = createFakeApp('/app');
        const responseBuidler = new JSONResponseBuilder({ test: 'ok' }, StatusCodes.Ok);
        app.add(Method.Get, '/status', async () => {
            return responseBuidler;
        });

        server.app(app);

        const requestReader = createFakeRequestReader({ appName: '/app', route: '/status', method: Method.Get });
        const response = await server.resolve(requestReader);

        expect(response).to.deep.equals(responseBuidler.build());
    });

    it('should listen', async () => {
        await awaitListening();
        expect(server.isListening).to.be.true;
    });

    it('should stop', async () => {
        await awaitListening();
        await server.stop();
        expect(server.isListening).to.be.false;
    });

    it('should listen and get the address', async () => {
        await awaitListening();
        const addressInfo = server.addressInfo;
        expect(addressInfo?.address).to.not.be.undefined;
        expect(addressInfo?.port).to.not.be.undefined;
        expect(addressInfo?.family).to.not.be.undefined;
    });

    it('should listen and resolve an incoming get request', async () => {
        const app = createFakeApp('/app');
        const responseBuidler = new JSONResponseBuilder({ test: 'ok' }, StatusCodes.Ok);
        app.add(Method.Get, '/status', async () => {
            return responseBuidler;
        });

        server.app(app);
        await awaitListening();
        const requestReader = createFakeRequestReader({ method: Method.Get, appName: '/app', route: '/status' });
        const responseBody = await (await server.resolve(requestReader)).body;
        expect(responseBody).to.be.equals(responseBuidler.build().body);
    });

    it('should listen and resolve an incoming post request', async () => {
        const app = createFakeApp('/app');
        let responseBuidler: ResponseBuilder = null as any;
        app.add(Method.Post, '/statusTest', async requestReader => {
            const body = await requestReader.read();
            responseBuidler = new JSONResponseBuilder({ test: 'ok', message: body.json }, StatusCodes.Ok);
            return responseBuidler;
        });

        server.app(app);
        await awaitListening();

        const message = {
            "name": "Test",
            "age": 55,
            "account": [0, 1, 34235, "43tg"]
        };
        const requestReader = createFakeRequestReader({ method: Method.Post, appName: '/app', route: '/statusTest' }, { json: message });
        const responseBody = await (await server.resolve(requestReader)).body;

        expect(responseBuidler).to.not.be.null;
        const expectedResponseBody = responseBuidler.build().body;
        expect(JSON.parse(expectedResponseBody as string).message).to.deep.equals(message);
        expect(responseBody).to.be.equals(expectedResponseBody);
    });

    it('should listen and resolve the right endpoint', async () => {
        const app = createFakeApp('/app');
        let responseBuidler: ResponseBuilder = null as any;
        app.add(Method.Post, '/statusTest', async requestReader => {
            const body = await requestReader.read();
            responseBuidler = new JSONResponseBuilder({ test: 'ok', message: body.json }, StatusCodes.Ok);
            return responseBuidler;
        });

        server.app(createFakeApp('/app2'));
        server.app(app);
        server.app(createFakeApp('/app3'));
        server.app(createFakeApp('/sadsaff'));
        server.app(createFakeApp('asfg34y'));
        await awaitListening();

        const message = {
            "name": "Test",
            "age": 55,
            "account": [0, 1, 34235, "43tg"]
        };
        const requestReader = createFakeRequestReader({ method: Method.Post, appName: '/app', route: '/statusTest' }, { json: message });
        const responseBody = await (await server.resolve(requestReader)).body;

        expect(responseBuidler).to.not.be.null;
        const expectedResponseBody = responseBuidler.build().body;
        expect(JSON.parse(expectedResponseBody as string).message).to.deep.equals(message);
        expect(responseBody).to.be.equals(expectedResponseBody);
    });
});
