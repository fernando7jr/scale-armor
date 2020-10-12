import { expect } from 'chai';
import { App, AppProvider } from './app';
import { Method } from '../router';
import { RequestHead, RequestBody, RequestReader, ResponseBuilder, Response } from './request';
import { StatusCodes } from './status';
import { JSONResponseBuilder, StatusResponseBuilder, CommonResponseBuilder } from './response-builder';
import { Routing } from './routing';
import { Endpoint } from './endpoint';
import { AppWrapper } from './app-wrapper';


class TestApp extends App {
    constructor(name?: string) {
        super(name || '/test');
    }

    protected digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return endpoint.callback(requestReader);
    }
}


describe(Routing.name, () => {
    let app: TestApp;
    let routing: Routing;

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

    const createAppProvider = () => {
        return new class extends AppProvider {
            build(name: string): App {
                const app = new TestApp(name);
                this.copyEndpointsTo(app);
                return app;
            }
        }();
    };

    beforeEach(() => {
        app = new TestApp();
        routing = new Routing(app);
    });

    it('should inject endpoints', async () => {
        const func = async () => new StatusResponseBuilder(StatusCodes.Ok);
        routing.delete('/', func)
            .get('/', func)
            .patch('/', func)
            .post('/', func)
            .put('/', func);
        routing.get('/af', func)
            .patch('/f', func);

        expect(app.endpoints.length).to.equals(7);
        expect(app.respondsTo(Method.Delete, '/')).to.be.true;
        expect(app.respondsTo(Method.Get, '/')).to.be.true;
        expect(app.respondsTo(Method.Patch, '/')).to.be.true;
        expect(app.respondsTo(Method.Post, '/')).to.be.true;
        expect(app.respondsTo(Method.Put, '/')).to.be.true;
        expect(app.respondsTo(Method.Get, '/af')).to.be.true;
        expect(app.respondsTo(Method.Patch, '/f')).to.be.true;

        new Routing(app).get('/d', func);
        expect(app.endpoints.length).to.equals(8);
        expect(app.respondsTo(Method.Get, '/d')).to.be.true;
    });

    it('should resolve an endpoint', async () => {
        const body = { test: 'Hello World!' };


        routing.post('/', async requestReader => {
            expect(requestReader).to.not.be.undefined;
            expect(requestReader?.head.path).to.equals('/app/');
            expect(requestReader?.head.method).to.equals(Method.Post);
            expect(requestReader?.hasBody).to.be.true;
            const request = await requestReader.read();
            expect(request.json).to.equals('ok');
            return new JSONResponseBuilder(body, StatusCodes.Ok);
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Post }, { json: 'ok' });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.body).to.equals(JSON.stringify(body));
        expect(response.status).to.equals(StatusCodes.Ok);
        expect(response.contentType).to.equals('application/json');
    });

    it('should inject endpoints on a provided-app', async () => {
        class TestControllerClass {
            private message = 'ok';

            @Routing.Post('/test-endpoint')
            @Routing.Get('/test-endpoint')
            public async testEndpoint() {
                return new JSONResponseBuilder(this.message, StatusCodes.Ok);
            }
        }

        const obj = new TestControllerClass();
        const appProvider = createAppProvider();
        const app = AppWrapper.bindTargetToAppProvider(obj, createAppProvider()).build('/');
        expect(app.name).to.equals('/');
        expect(appProvider.respondsTo(Method.Get, '/test-endpoint')).to.be.false;
        expect(appProvider.respondsTo(Method.Post, '/test-endpoint')).to.be.false;
        expect(app.respondsTo(Method.Get, '/test-endpoint')).to.be.true;
        expect(app.respondsTo(Method.Post, '/test-endpoint')).to.be.true;

        let responseBuilder: ResponseBuilder;
        let response: Response;

        responseBuilder = await app.resolve(createFakeRequestReader({ method: Method.Get, route: '/test-endpoint' }));
        response = responseBuilder.build();
        expect(response.body).to.equals('"ok"');
        responseBuilder = await app.resolve(createFakeRequestReader({ method: Method.Post, route: '/test-endpoint' }));
        response = responseBuilder.build();
        expect(response.body).to.equals('"ok"');
    });
});
