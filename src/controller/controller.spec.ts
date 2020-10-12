import { expect } from 'chai';
import { Method } from '../router';
import {
    RequestHead,
    RequestBody,
    RequestReader,
    StatusCodes,
    App,
    Endpoint,
    Response,
    AppWrapper,
    AppProvider,
    ResponseBuilder
} from '../app/';
import { Context } from './context';
import { Controller, ControllerDataCallback, ControllerParamsCallback } from './controller';


class TestApp extends App {
    constructor(name?: string) {
        super(name || '/test');
    }

    protected digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return endpoint.callback(requestReader);
    }
}


describe(Controller.name, () => {
    let app: TestApp;
    let controller: Controller;

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

    const resolveEndpoint = async (head: Partial<RequestHead>, body?: Partial<RequestBody>) => {
        const requestReader = createFakeRequestReader(head, body);
        const builder = await app.resolve(requestReader);
        return builder.build();
    };

    beforeEach(() => {
        app = new TestApp();
        controller = new Controller(app);
    });

    it('should inject endpoints', () => {
        controller.get('/', async () => 'ok')
            .delete('/', async () => 'ok')
            .patch('/', async () => 'ok')
            .post('/', async () => 'ok')
            .put('/', async () => 'ok')
            .get('/abc', async () => 'ok');
        controller.get('/test', async () => 'ok')
            .get('/ctrl/beta', async () => 'ok');

        expect(app.endpoints.length).to.equals(8);
        expect(app.respondsTo(Method.Get, '/')).to.be.true;
        expect(app.respondsTo(Method.Delete, '/')).to.be.true;
        expect(app.respondsTo(Method.Patch, '/')).to.be.true;
        expect(app.respondsTo(Method.Post, '/')).to.be.true;
        expect(app.respondsTo(Method.Put, '/')).to.be.true;
        expect(app.respondsTo(Method.Get, '/abc')).to.be.true;
        expect(app.respondsTo(Method.Get, '/test')).to.be.true;
        expect(app.respondsTo(Method.Get, '/ctrl/beta')).to.be.true;
    });

    it('should pass the right params when resolving', async () => {
        const paramsController: ControllerParamsCallback = async (context: Context) => {
            const query = context.query;
            expect(query).to.not.be.undefined;
            const request = context.request;
            expect(request).to.not.be.undefined;
            return { method: request.method, query };
        };
        const dataController: ControllerDataCallback = async (context: Context, data: any) => {
            const query = context.query;
            expect(query).to.not.be.undefined;
            const request = context.request;
            expect(request).to.not.be.undefined;
            return { data, method: request.method, query };
        };

        controller.get('/', paramsController)
            .delete('/', paramsController)
            .patch('/', dataController)
            .post('/', dataController)
            .put('/', dataController);

        let response: Response;
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Get });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Get, query: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Get, params: { id: 2, age: 3 } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Get, query: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Delete });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Delete, query: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Delete, params: { id: 2, age: 3 } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Delete, query: { id: 2, age: 3 } }));

        const body = { test: 'Hello World!' };
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Post, query: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Post, query: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Patch, query: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Patch, query: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Put, query: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Put, query: { id: 2, age: 3 } }));
    });

    it('should work with either json, form and binary', async () => {
        const dataController: ControllerDataCallback = async (context: Context, data: any) => {
            return { data };
        };

        controller.patch('/', dataController)
            .post('/', dataController)
            .put('/', dataController);

        let response: Response;
        const body = { test: 'Hello World!' };

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { form: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body }));

        const buffer = Buffer.from(body.test);
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { body: buffer });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: buffer }));
    });

    it('should parse reserved query params correctly', async () => {
        controller.get('/', async (context: Context) => {
            const query = context.query;
            return { query, page: context.page, pageSize: context.pageSize };
        });

        let response: Response;
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Get, params: { $page: 1, $pageSize: 30, test: 'ok' } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ query: { test: 'ok' }, page: 1, pageSize: 30 }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Get, params: { $page: 1, test: 'ok' } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ query: { test: 'ok' }, page: 1, pageSize: undefined }));
    });

    it('should inject endpoints on a provided-app', async () => {
        class TestControllerClass {
            private message = 'ok';

            @Controller.Get('/test-endpoint')
            @Controller.Post('/test-endpoint')
            public async testEndpoint(context: Context) {
                return this.message;
            }
        }

        const obj = new TestControllerClass();
        const appProvider = createAppProvider();
        const app = AppWrapper.bindTargetToAppProvider(obj, createAppProvider()).build('/');
        expect(appProvider.respondsTo(Method.Get, '/test-endpoint')).to.be.false;
        expect(app.respondsTo(Method.Get, '/test-endpoint')).to.be.true;

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
