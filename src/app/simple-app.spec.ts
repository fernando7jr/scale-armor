import { expect } from 'chai';
import { SimpleApp } from './simple-app';
import { Method } from '../router';
import { RequestHead, RequestBody, RequestReader } from './request';
import { StatusCodes } from './status';
import { JSONResponseBuilder } from './response-builder';


describe(SimpleApp.name, () => {
    let app: SimpleApp;

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
        app = new SimpleApp('test');
    });

    it('should have an name', () => {
        expect(app.name, 'test');
    });

    it('should store an endpoint', () => {
        app.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => null as any
        });
        app.endpoint(Method.Get, '/test', async () => null as any);

        expect(app.endpoints.length).to.equals(2);
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
        app.endpoint({
            method: Method.Get,
            route: '/',
            callback: async () => {
                return new JSONResponseBuilder({ message: 'Get test' }, StatusCodes.Ok);
            }
        }).endpoint(Method.Post, '/', async () => {
            return new JSONResponseBuilder({ message: 'Post Test' }, StatusCodes.Created);
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Post });
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

    it('should set a custom notFound endpoint', async () => {
        const body = { test: 'Hello World!' };
        app.setNotFoundCallback(async () => {
            return new JSONResponseBuilder(body, StatusCodes.NotFound);
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Get });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.body).to.equals(JSON.stringify(body));
        expect(response.status).to.equals(StatusCodes.NotFound);
        expect(response.contentType).to.equals('application/json');
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

    it('should resolve to custom InternalServerError callback', async () => {
        app.setRequesthandlingErrorCallback(async () => {
            return new JSONResponseBuilder({ test: 'error' }, StatusCodes.InternalServerError);
        });
        app.endpoint(Method.Get, '/', async () => {
            throw new Error('Catch me!');
        });

        const requestReader = createFakeRequestReader({ path: '/app/', route: '/', method: Method.Get });
        const builder = await app.resolve(requestReader);
        const response = builder.build();

        expect(response.status).to.equals(StatusCodes.InternalServerError);
        expect(response.body).to.equals('{"test":"error"}');
    });
});
