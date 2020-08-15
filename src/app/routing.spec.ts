import { expect } from 'chai';
import { App } from './app';
import { Method } from '../router';
import { RequestHead, RequestBody, RequestReader } from './request';
import { StatusCodes } from './status';
import { JSONResponseBuilder, StatusResponseBuilder, CommonResponseBuilder } from './response-builder';
import { Routing } from './routing';
import { Endpoint } from './endpoint';


class TestApp extends App {
    constructor() {
        super('/test');
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

        Routing.for(app).get('/d', func);
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

    it('should inject endpoints through decorator', async () => {
        class ControllerTest1 {
            @routing.get('/test')
            @routing.patch('/test')
            @routing.post('/test')
            @routing.put('/test')
            @routing.delete('/test24')
            @routing.get('/tees')
            @routing.get('/tees/24')
            async test() {
                return new StatusResponseBuilder(StatusCodes.Ok);
            }
        };
        const controllers = new ControllerTest1();

        expect(app.endpoints.length).to.equals(7);
        expect(app.respondsTo(Method.Get, '/test')).to.be.true;
        expect(app.respondsTo(Method.Patch, '/test')).to.be.true;
        expect(app.respondsTo(Method.Post, '/test')).to.be.true;
        expect(app.respondsTo(Method.Put, '/test')).to.be.true;
        expect(app.respondsTo(Method.Delete, '/test24')).to.be.true;
        expect(app.respondsTo(Method.Get, '/tees')).to.be.true;
        expect(app.respondsTo(Method.Get, '/tees/24')).to.be.true;

        const responseBuilder = await controllers.test();
        expect(responseBuilder).to.be.instanceOf(CommonResponseBuilder);
        expect(responseBuilder).to.be.instanceOf(StatusResponseBuilder);
    });
});
