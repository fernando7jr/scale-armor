import { Method } from './request';
import { AppWrapper } from './app-wrapper';
import { EndpointCallback } from './endpoint';


export class Routing extends AppWrapper {
    protected wrapEndpoint(method: Method, route: string, func: Function): this {
        this.injectEndpoint({
            method,
            route,
            callback: req => func(req)
        });
        return this;
    }

    get(route: string): MethodDecorator;
    get(route: string, func: EndpointCallback): this;
    get(route: string, func?: EndpointCallback): MethodDecorator | this {
        const method = Method.Get;
        return this.wrap(method, route, func);
    }

    post(route: string): MethodDecorator;
    post(route: string, func: EndpointCallback): this;
    post(route: string, func?: EndpointCallback): MethodDecorator | this {
        const method = Method.Post;
        return this.wrap(method, route, func);
    }

    put(route: string): MethodDecorator;
    put(route: string, func: EndpointCallback): this;
    put(route: string, func?: EndpointCallback): MethodDecorator | this {
        const method = Method.Put;
        return this.wrap(method, route, func);
    }

    patch(route: string): MethodDecorator;
    patch(route: string, func: EndpointCallback): this;
    patch(route: string, func?: EndpointCallback): MethodDecorator | this {
        const method = Method.Patch;
        return this.wrap(method, route, func);
    }

    delete(route: string): MethodDecorator;
    delete(route: string, func: EndpointCallback): this;
    delete(route: string, func?: EndpointCallback): MethodDecorator | this {
        const method = Method.Delete;
        return this.wrap(method, route, func);
    }
}
