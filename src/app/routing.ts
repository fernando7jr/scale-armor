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

    get(route: string, func: EndpointCallback): this {
        const method = Method.Get;
        return this.wrapEndpoint(method, route, func);
    }

    post(route: string, func: EndpointCallback): this {
        const method = Method.Post;
        return this.wrapEndpoint(method, route, func);
    }

    put(route: string, func: EndpointCallback): this {
        const method = Method.Put;
        return this.wrapEndpoint(method, route, func);
    }

    patch(route: string, func: EndpointCallback): this {
        const method = Method.Patch;
        return this.wrapEndpoint(method, route, func);
    }

    delete(route: string, func: EndpointCallback): this {
        const method = Method.Delete;
        return this.wrapEndpoint(method, route, func);
    }

    private static wrapInstanceless(method: Method, route: string): MethodDecorator {
        return <T extends Object>(target: T | any, propertyName: string | symbol, type: TypedPropertyDescriptor<T>) => {
            this.decorateClassMethod<T>(target, (endpointsProvider, self) => {
                const prop: (...args: any[]) => Promise<any> = Reflect.get(self, propertyName);
                const routing = new Routing(endpointsProvider);
                routing.wrapEndpoint(method, route, (...args: any[]) => prop.apply(self, args));
            });
        };
    }

    static Get(route: string): MethodDecorator {
        const method = Method.Get;
        return this.wrapInstanceless(method, route);
    }

    static Post(route: string): MethodDecorator {
        const method = Method.Post;
        return this.wrapInstanceless(method, route);
    }

    static Put(route: string): MethodDecorator {
        const method = Method.Put;
        return this.wrapInstanceless(method, route);
    }

    static Patch(route: string): MethodDecorator {
        const method = Method.Patch;
        return this.wrapInstanceless(method, route);
    }

    static Delete(route: string): MethodDecorator {
        const method = Method.Delete;
        return this.wrapInstanceless(method, route);
    }
}
