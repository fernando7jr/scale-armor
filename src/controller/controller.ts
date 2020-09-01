import { Request, Method, Params } from '../app/request';
import { EndpointCallback } from '../app/endpoint';
import { StatusCodes } from '../app/status';
import { AppWrapper } from '../app/app-wrapper';
import { JSONResponseBuilder, CommonResponseBuilder } from '../app/response-builder';
import { Context } from './context';
import { MaybeArray } from '../utils';

export type ControllerParamsCallback<TOut = any> = (context: Context) => Promise<MaybeArray<TOut>>;
export type ControllerDataCallback<TOut = any, TData = any> = (context: Context, data: TData) => Promise<MaybeArray<TOut>>;
export type ControllerCallback<TOut = any, TData = any> = ControllerParamsCallback<TOut> | ControllerDataCallback<TOut, TData>;

export class Controller extends AppWrapper<ControllerCallback> {
    private static reservedQueryParams = ['$page', '$pageSize'] as const;

    protected getContext(request: Request, partialContext?: Context): Context {
        const params = request.params || {};
        const query: Params = {};
        const reserved: Params = {};

        Object.keys(params).forEach(key => {
            if (Controller.reservedQueryParams.includes(key as any)) {
                reserved[key] = params[key];
            } else {
                query[key] = params[key];
            }
        });

        return Object.assign({
            request,
            query,
            page: reserved.$page,
            pageSize: reserved.$pageSize,
        }, partialContext || {});
    }

    protected async resolveControllerCallback(method: Method, request: Request, func: ControllerCallback) {
        const context = this.getContext(request);
        if (method === Method.Get || method === Method.Delete) {
            return (func as ControllerParamsCallback)(context);
        }
        const data = request.json || request.form || request.body;
        return (func as ControllerDataCallback)(context, data);
    }

    protected wrapEndpoint(method: Method, route: string, func: ControllerCallback): this {
        let callback: EndpointCallback = async requestReader => {
            const request = await requestReader.read();
            const data = await this.resolveControllerCallback(method, request, func);

            let status = StatusCodes.Ok;
            if (data instanceof CommonResponseBuilder) {
                return data;
            } else if (!data && data !== 0) {
                status = StatusCodes.NoContent;
            }
            return new JSONResponseBuilder(data, status);
        };

        this.injectEndpoint({
            method,
            route,
            callback
        });
        return this;
    }

    get<TOut>(route: string, func: ControllerParamsCallback<TOut>): this {
        const method = Method.Get;
        return this.wrapEndpoint(method, route, func);
    }

    post<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Post;
        return this.wrapEndpoint(method, route, func);
    }

    put<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Put;
        return this.wrapEndpoint(method, route, func);
    }

    patch<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Patch;
        return this.wrapEndpoint(method, route, func);
    }

    delete<TOut>(route: string, func: ControllerParamsCallback<TOut>): this {
        const method = Method.Delete;
        return this.wrapEndpoint(method, route, func);
    }

    private static wrapInstanceless(method: Method, route: string): MethodDecorator {
        return <T extends Object>(target: T | any, propertyName: string | symbol, type: TypedPropertyDescriptor<T>) => {
            this.decorateClassMethod<T>(target, (endpointsProvider, self) => {
                const prop: (...args: any[]) => Promise<any> = Reflect.get(self, propertyName);
                const controller = new Controller(endpointsProvider);
                controller.wrapEndpoint(method, route, (...args: any[]) => prop.apply(self, args));
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
