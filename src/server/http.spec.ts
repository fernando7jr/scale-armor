import { expect } from 'chai';
import httpClient from 'http';
import { SimpleApp, RequestReader, JSONResponseBuilder, RequestHead, RequestBody, Method, ResponseBuilder, Headers } from '../app';
import { StatusCodes } from '../app/status';
import { HttpAppServer } from './http';


describe(HttpAppServer.name, () => {
    let server: HttpAppServer;

    const createFakeApp = (name: string) => {
        return new class extends SimpleApp { }(name);
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

    const __doHttp = async (method: Method, path: string, body?: string | Buffer, headers?: Headers) => {
        const port = server.addressInfo?.port;
        const url = `http://localhost:${port}${path}`;

        return await new Promise<string>((resolve, reject) => {
            const request = httpClient.request(url, { method, headers }, response => {
                let data = '';
                response.on('data', chunk => {
                    data += chunk;
                });
                response.on('end', () => {
                    resolve(data);
                });
                response.on('error', reject);
            });

            if (body) {
                request.end(body);
            } else {
                request.end();
            }
        });
    };

    const httpGet = (path: string, headers?: Headers) => {
        return __doHttp(Method.Get, path, undefined, headers);
    };

    const httpPost = (path: string, body: string | Buffer, headers?: Headers) => {
        return __doHttp(Method.Post, path, body, headers);
    };

    const httpPostJson = (path: string, data: any, headers?: Headers) => {
        const body = JSON.stringify(data);
        headers = Object.assign({}, headers, {
            'content-type': 'application/json',
            'content-length': body.length.toString(),
            'content-encoding': 'utf-8'
        });
        return httpPost(path, body, headers);
    };

    beforeEach(() => {
        server = new HttpAppServer();
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
        app.endpoint(Method.Get, '/status', async () => {
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
        app.endpoint(Method.Get, '/status', async () => {
            return responseBuidler;
        });

        server.app(app);
        await awaitListening();
        const responseBody = await httpGet('/app/status');
        expect(responseBody).to.be.equals(responseBuidler.build().body);
    });

    it('should listen and resolve an incoming post request', async () => {
        const app = createFakeApp('/app');
        let responseBuidler: ResponseBuilder = null as any;
        app.endpoint(Method.Post, '/status', async requestReader => {
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
        const responseBody = await httpPostJson('/app/status', message);

        expect(responseBuidler).to.not.be.null;
        const expectedResponseBody = responseBuidler.build().body;
        expect(JSON.parse(expectedResponseBody as string).message).to.deep.equals(message);
        expect(responseBody).to.be.equals(expectedResponseBody);
    });
});
