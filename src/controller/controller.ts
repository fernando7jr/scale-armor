import { Request, Method, Params } from '../app/request';
import { EndpointCallback } from '../app/endpoint';
import { StatusCodes } from '../app/status';
import { AppWrapper } from '../app/app-wrapper';
import { Context } from './context';
import { MaybeArray } from '../utils';
import { JSONResponseBuilder, CommonResponseBuilder } from '../app';

export type ControllerParamsCallback<TOut = any> = (params: Params, context: Context) => Promise<MaybeArray<TOut>>;
export type ControllerDataCallback<TIn = any, TOut = any> = (params: Params, context: Context, data: TIn) => Promise<MaybeArray<TOut>>;
export type ControllerCallback<TIn = any, TOut = any> = ControllerParamsCallback<TOut> | ControllerDataCallback<TIn, TOut>;


export class Controller extends AppWrapper<ControllerCallback> {
    protected getContext(request: Request, partialContext?: Context): Context {
        return Object.assign({
            request,
            page: request.params?.$page,
            pageSize: request.params?.$pageSize,
        }, partialContext || {});
    }

    protected async resolveControllerCallback(method: Method, request: Request, func: ControllerCallback) {
        const context = this.getContext(request);
        const params = request.params || {};
        if (method === Method.Get || method === Method.Delete) {
            return (func as ControllerParamsCallback)(params, context);
        }
        const data = request.json || request.form || request.body;
        return (func as ControllerDataCallback)(params, context, data);
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
    post<TIn, TOut>(route: string, func: ControllerDataCallback<TIn, TOut>): this;
    post<TIn, TOut>(route: string, func?: ControllerDataCallback<TIn, TOut>): MethodDecorator | this {
        const method = Method.Post;
        return this.wrap(method, route, func);
    }

    put(route: string): MethodDecorator;
    put<TIn, TOut>(route: string, func: ControllerDataCallback<TIn, TOut>): this;
    put<TIn, TOut>(route: string, func?: ControllerDataCallback<TIn, TOut>): MethodDecorator | this {
        const method = Method.Put;
        return this.wrap(method, route, func);
    }

    patch(route: string): MethodDecorator;
    patch<TIn, TOut>(route: string, func: ControllerDataCallback<TIn, TOut>): this;
    patch<TIn, TOut>(route: string, func?: ControllerDataCallback<TIn, TOut>): MethodDecorator | this {
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
