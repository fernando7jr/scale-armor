import { expect } from 'chai';
import { Method } from '../router';
import {
    RequestHead,
    RequestBody,
    RequestReader,
    Params,
    StatusCodes,
    App,
    Endpoint,
    Response
} from '../app/';
import { Context } from './context';
import { Controller, ControllerDataCallback, ControllerParamsCallback } from './controller';


class TestApp extends App {
    constructor() {
        super('/test');
    }

    protected digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return endpoint.callback(requestReader);
    }
}


describe(App.name, () => {
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
        const paramsController: ControllerParamsCallback = async (params: Params, context: Context) => {
            expect(params).to.not.be.undefined;
            expect(context.request).to.not.be.undefined;
            return { method: context.request.method, params };
        };
        const dataController: ControllerDataCallback = async (params: Params, context: Context, data: any) => {
            expect(params).to.not.be.undefined;
            expect(context.request).to.not.be.undefined;
            return { data, method: context.request.method, params };
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
        expect(response.body).to.equals(JSON.stringify({ method: Method.Get, params: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Get, params: { id: 2, age: 3 } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Get, params: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Delete });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Delete, params: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Delete, params: { id: 2, age: 3 } });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ method: Method.Delete, params: { id: 2, age: 3 } }));

        const body = { test: 'Hello World!' };
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Post, params: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Post, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Post, params: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Patch, params: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Patch, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Patch, params: { id: 2, age: 3 } }));

        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Put, params: {} }));
        response = await resolveEndpoint({ path: '/app/', route: '/', method: Method.Put, params: { id: 2, age: 3 } }, { json: body });
        expect(response.status).to.deep.equals(StatusCodes.Ok);
        expect(response.contentType).to.contains('application/json');
        expect(response.body).to.equals(JSON.stringify({ data: body, method: Method.Put, params: { id: 2, age: 3 } }));
    });

    it('should inject endpoints through decorator', () => {
        class Controller1 {
            @controller.delete('/')
            @controller.get('/')
            @controller.patch('/')
            @controller.post('/')
            @controller.put('/')
            @controller.get('/abc')
            @controller.get('/test2')
            @controller.get('/ctrl/beta')
            async endpoint() {
                return 'ok';
            }
        }

        expect(app.endpoints.length).to.equals(8);
        expect(app.respondsTo(Method.Get, '/')).to.be.true;
        expect(app.respondsTo(Method.Delete, '/')).to.be.true;
        expect(app.respondsTo(Method.Patch, '/')).to.be.true;
        expect(app.respondsTo(Method.Post, '/')).to.be.true;
        expect(app.respondsTo(Method.Put, '/')).to.be.true;
        expect(app.respondsTo(Method.Get, '/abc')).to.be.true;
        expect(app.respondsTo(Method.Get, '/test2')).to.be.true;
        expect(app.respondsTo(Method.Get, '/ctrl/beta')).to.be.true;
    });

    it('should work with either json, form and binary', async () => {
        const dataController: ControllerDataCallback = async (params: Params, context: Context, data: any) => {
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

        const buffer = new Buffer(body.test);
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
});
