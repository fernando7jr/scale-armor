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

/**
 * Controller is a app wrapper which automatically handles request reading and response building
 * @class
 * @extends AppWrapper
 */
export class Controller extends AppWrapper<ControllerCallback> {
    /**
     * The reserved words for params
     * Those params are available directly inside the Context object
     * @static
     * @readonly
     * @type {Array}
     */
    private static reservedQueryParams = ['$page', '$pageSize', '$sortBy', '$sortType'] as const;

    /**
     * Get the context out of the request
     * @param {Request} request - the request object
     * @param {Context} partialContext - a partial Context to be assigned to the new Context object
     */
    protected getContext(request: Request, partialContext?: Context): Context {
        const params = request.params || {};
        const query: Params = {};
        const reserved: Params = {};

        // Split reserved params from the query params
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

    /**
     * Resolves the controller callback passing the appropriate params to it
     * @async
     * @param method {Method} - the method type of the binding
     * @param request {Request} - the original request object to create the context
     * @param func {function} - the callback to be resolved
     * @returns {any} the response of the resolved callback
     */
    protected async resolveControllerCallback(method: Method, request: Request, func: ControllerCallback) {
        const context = this.getContext(request);
        if (method === Method.Get || method === Method.Delete) {
            return (func as ControllerParamsCallback)(context);
        }
        // data is only present when there is a body to be read
        const data = request.json || request.form || request.body;
        return (func as ControllerDataCallback)(context, data);
    }

    /**
     * Wrap the endpoint to be executed as a controller
     * @param method {Method} - the method type of the binding
     * @param route {string} - the route of the binding
     * @param func {function} - the function to be wrapped
     * @returns {this} @this
     */
    protected wrapEndpoint(method: Method, route: string, func: ControllerCallback): this {
        // Create a callback which applies the Controller logic
        const callback: EndpointCallback = async requestReader => {
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

    /**
     * Add a get controller endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Controller} @this
     * @example
     *  const controller = new Controller(app);
     *  controller.get('/status', async context => {
     *      return { message: 'ok' };
     *  });
     */
    get<TOut>(route: string, func: ControllerParamsCallback<TOut>): this {
        const method = Method.Get;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a post controller endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Controller} @this
     * @example
     *  const controller = new Controller(app);
     *  controller.post('/status', async (context, data) => {
     *      return { message: 'ok', data };
     *  });
     */
    post<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Post;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a put controller endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Controller} @this
     * @example
     *  const controller = new Controller(app);
     *  controller.put('/status', async (context, data) => {
     *      return { message: 'ok', data };
     *  });
     */
    put<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Put;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a patch controller endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Controller} @this
     * @example
     *  const controller = new Controller(app);
     *  controller.patch('/status', async (context, data) => {
     *      return { message: 'ok', data };
     *  });
     */
    patch<TOut>(route: string, func: ControllerDataCallback<TOut>): this {
        const method = Method.Patch;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a delete controller endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Controller} @this
     * @example
     *  const controller = new Controller(app);
     *  controller.delete('/status', async context => {
     *      return { message: 'ok' };
     *  });
     */
    delete<TOut>(route: string, func: ControllerParamsCallback<TOut>): this {
        const method = Method.Delete;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Decorates a class method to bind it as endpoint when building an app
     * @static
     * @param {Method} method - the route for the endpoint
     * @param {string} route - the method decorator
     * @returns {function} the method decorator
     */
    private static wrapInstanceless(method: Method, route: string): MethodDecorator {
        return <T extends Object>(target: T | any, propertyName: string | symbol, type: TypedPropertyDescriptor<T>) => {
            this.decorateClassMethod<T>(target, (endpointsProvider, self) => {
                const prop: (...args: any[]) => Promise<any> = Reflect.get(self, propertyName);
                const controller = new Controller(endpointsProvider);
                controller.wrapEndpoint(method, route, (...args: any[]) => prop.apply(self, args));
            });
        };
    }

    /**
     * Decorates a class method to bind it as GET controller endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      private get message() {
     *          return 'Hello World';
     *      }
     * 
     *      @Controller.Get('/')
     *      async getStatus(context: Context) {
     *          return { message: this.message };
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     *  ```
     */
    static Get(route: string): MethodDecorator {
        const method = Method.Get;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as POST controller endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      private get message() {
     *          return 'Hello World';
     *      }
     * 
     *      @Controller.Post('/')
     *      async getStatus(context: Context, data: any) {
     *          return { message: this.message, data };
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     *  ```
     */
    static Post(route: string): MethodDecorator {
        const method = Method.Post;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as PUT controller endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      private get message() {
     *          return 'Hello World';
     *      }
     * 
     *      @Controller.Put('/')
     *      async getStatus(context: Context, data: any) {
     *          return { message: this.message, data };
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     *  ```
     */
    static Put(route: string): MethodDecorator {
        const method = Method.Put;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as PATCH controller endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      private get message() {
     *          return 'Hello World';
     *      }
     * 
     *      @Controller.Patch('/')
     *      async getStatus(context: Context, data: any) {
     *          return { message: this.message, data };
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     *  ```
     */
    static Patch(route: string): MethodDecorator {
        const method = Method.Patch;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as Delete controller endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      private get message() {
     *          return 'Hello World';
     *      }
     * 
     *      @Controller.Delete('/')
     *      async getStatus(context: Context) {
     *          return { message: this.message };
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     *  ```
     */
    static Delete(route: string): MethodDecorator {
        const method = Method.Delete;
        return this.wrapInstanceless(method, route);
    }
}
