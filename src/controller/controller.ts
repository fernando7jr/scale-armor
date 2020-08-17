import { Request, Method, Params } from '../app/request';
import { EndpointCallback } from '../app/endpoint';
import { StatusCodes } from '../app/status';
import { AppWrapper } from '../app/app-wrapper';
import { Context } from './context';
import { MaybeArray } from '../utils';
import { JSONResponseBuilder, CommonResponseBuilder } from '../app';

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

    get(route: string): MethodDecorator;
    get<TOut>(route: string, func: ControllerParamsCallback<TOut>): this;
    get<TOut>(route: string, func?: ControllerParamsCallback<TOut>): MethodDecorator | this {
        const method = Method.Get;
        return this.wrap(method, route, func);
    }

    post(route: string): MethodDecorator;
    post<TOut, TData>(route: string, func: ControllerDataCallback<TOut, TData>): this;
    post<TOut, TData>(route: string, func?: ControllerDataCallback<TOut, TData>): MethodDecorator | this {
        const method = Method.Post;
        return this.wrap(method, route, func);
    }

    put(route: string): MethodDecorator;
    put<TOut, TData>(route: string, func: ControllerDataCallback<TOut, TData>): this;
    put<TOut, TData>(route: string, func?: ControllerDataCallback<TOut, TData>): MethodDecorator | this {
        const method = Method.Put;
        return this.wrap(method, route, func);
    }

    patch(route: string): MethodDecorator;
    patch<TOut, TData>(route: string, func: ControllerDataCallback<TOut, TData>): this;
    patch<TOut, TData>(route: string, func?: ControllerDataCallback<TOut, TData>): MethodDecorator | this {
        const method = Method.Patch;
        return this.wrap(method, route, func);
    }

    delete(route: string): MethodDecorator;
    delete<TOut>(route: string, func: ControllerParamsCallback<TOut>): this;
    delete<TOut>(route: string, func?: ControllerParamsCallback<TOut>): MethodDecorator | this {
        const method = Method.Delete;
        return this.wrap(method, route, func);
    }
}
