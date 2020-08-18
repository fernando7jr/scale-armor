import { expect } from 'chai';
import { Method } from '../router';
import { RequestHead, RequestBody, RequestReader } from './request';
import { StatusCodes } from './status';
import { JSONResponseBuilder } from './response-builder';
import { App, AppProvider } from './app';
import { Endpoint } from './endpoint';


class TestApp extends App {
    constructor(name?: string) {
        super(name || '/test');
    }

    protected digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return endpoint.callback(requestReader);
    }
}


describe(App.name, () => {
    let app: TestApp;

    const createFakeRequestReader = (head: Partial<RequestHead>, body?: Partial<RequestBody>) => {
        const fakeRequestreader: Partial<RequestReader> = {
            hasBody: !!body,
            head: head as RequestHead,
            read() {
                const request = Object.assign({}, head as RequestHead, body as RequestBody);
                return Promise.resolve(request);
            }
        };

        return fakeRequestreader as RequestReader;
    };

    beforeEach(() => {
        app = new TestApp();
    });

    it('should have an name', () => {
        expect(app.name, '/test');
    });

    it('should store an endpoint', () => {
        app.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => null as any
        });
        app.endpoint(Method.Get, '/test', async () => null as any);

        expect(app.endpoints.length).to.equals(2);
        expect(app.respondsTo(Method.Get, '/')).to.be.true;
        expect(app.respondsTo(Method.Get, '/test')).to.be.true;
    });

    it('should resolve an endpoint', async () => {
        const body = { test: 'Hello World!' };
        app.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => {
                return new JSONResponseBuilder(body, StatusCodes.Ok);
            }
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Get });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.body).to.equals(JSON.stringify(body));
        expect(response.status).to.equals(StatusCodes.Ok);
        expect(response.contentType).to.equals('application/json');
    });

    it('should resolve the correct endpoint', async () => {
        const body = { test: 'ok' };

        app.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => {
                return new JSONResponseBuilder({ message: 'Get test' }, StatusCodes.Ok);
            }
        }).endpoint(Method.Post, '/', async requestReader => {
            const request = await requestReader.read();
            expect(request.json).to.be.deep.equal(body);
            return new JSONResponseBuilder({ message: 'Post Test' }, StatusCodes.Created);
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Post }, { json: body });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.body).to.not.undefined;
        expect(response.body).to.equals('{"message":"Post Test"}');
        expect(response.status).to.equals(StatusCodes.Created);
        expect(response.contentType).to.equals('application/json');
    });

    it('should resolve to NotFound when can not locate endpoint', async () => {
        const requestReader = createFakeRequestReader({ path: '/app/test', route: '/test', method: Method.Get });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.status).to.equals(StatusCodes.NotFound);
    });

    it('should resolve to InternalServerError', async () => {
        app.endpoint(Method.Get, '/', async () => {
            throw new Error('Catch me!');
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Get });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.status).to.equals(StatusCodes.InternalServerError);
    });
});

describe(AppProvider.name, () => {
    let appProvider: AppProvider;

    beforeEach(() => {
        appProvider = new class extends AppProvider {
            build(name: string): App {
                return new TestApp(name);
            }
        }();
    });

    it('should build an app with the same given name', () => {
        const name = '/app-provided-for-test';
        const app = appProvider.build(name);
        expect(app.name).to.be.equal(name);
    });

    it('should store an endpoint', () => {
        appProvider.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => null as any
        });
        appProvider.endpoint(Method.Get, '/test', async () => null as any);

        expect(appProvider.endpoints.length).to.equals(2);
        expect(appProvider.respondsTo(Method.Get, '/')).to.be.true;
        expect(appProvider.respondsTo(Method.Get, '/test')).to.be.true;
    });
});
