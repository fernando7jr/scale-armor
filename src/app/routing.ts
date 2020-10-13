import { Method } from './request';
import { AppWrapper } from './app-wrapper';
import { EndpointCallback, EndpointsProvider } from './endpoint';


/**
 * Routing is an app-wrapper which makes easier to write endpoints to an App
 * @class
 * @extends AppWrapper
 */
export class Routing extends AppWrapper {
    /**
     * @constructor
     * @param endpointsProvider - the endpoints-provider
     */
    constructor(endpointsProvider: EndpointsProvider) {
        super(endpointsProvider);
    }

    /**
     * Wraps the endpoint around the given function
     * @param {Method} method - the method for the endpoint
     * @param {string} route - the route for the endpoint
     * @param {function} func - the function callback for the endpoint
     */
    protected wrapEndpoint(method: Method, route: string, func: Function): this {
        this.injectEndpoint({
            method,
            route,
            callback: req => func(req)
        });
        return this;
    }

    /**
     * Add a get endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Routing} @this
     * @example
     *  // Using Routing
     *  const routing = new Routing(app);
     *  routing.get('/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok));
     *  
     *  //Using App directly
     *  app.endpoint(Method.Get, '/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok))
     */
    get(route: string, func: EndpointCallback): this {
        const method = Method.Get;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a post endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Routing} @this
     * @example
     *  // Using Routing
     *  const routing = new Routing(app);
     *  routing.post('/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok));
     *  
     *  //Using App directly
     *  app.endpoint(Method.Post, '/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok)
     */
    post(route: string, func: EndpointCallback): this {
        const method = Method.Post;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a put endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Routing} @this
     * @example
     *  // Using Routing
     *  const routing = new Routing(app);
     *  routing.put('/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok));
     *  
     *  //Using App directly
     *  app.endpoint(Method.Put, '/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok)
     */
    put(route: string, func: EndpointCallback): this {
        const method = Method.Put;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a patch endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Routing} @this
     * @example
     *  // Using Routing
     *  const routing = new Routing(app);
     *  routing.patch('/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok));
     *  
     *  //Using App directly
     *  app.endpoint(Method.Patch, '/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok)
     */
    patch(route: string, func: EndpointCallback): this {
        const method = Method.Patch;
        return this.wrapEndpoint(method, route, func);
    }

    /**
     * Add a delete endpoint for the given route
     * @param {string} route - the route for the endpoint
     * @param {function} func - the endpoint callback
     * @returns {Routing} @this
     * @example
     *  // Using Routing
     *  const routing = new Routing(app);
     *  routing.delete('/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok));
     *  
     *  //Using App directly
     *  app.endpoint(Method.Delete, '/status', async requestReader => new StatusResponseBuilder(StatusCodes.Ok)
     */
    delete(route: string, func: EndpointCallback): this {
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
                const routing = new Routing(endpointsProvider);
                routing.wrapEndpoint(method, route, (...args: any[]) => prop.apply(self, args));
            });
        };
    }

    /**
     * Decorates a class method to bind it as GET endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      message = 'Hello World!';
     *      @Routing.Get('/')
     *      async getStatus(requestReader) {
     *          return new StatusResponseBuilder(StatusCodes.Ok, this.message);
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
     * Decorates a class method to bind it as POST endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      message = 'Hello World!';
     *      @Routing.Post('/')
     *      async postStatus(requestReader) {
     *          return new StatusResponseBuilder(StatusCodes.Ok, this.message);
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     * ```
     */
    static Post(route: string): MethodDecorator {
        const method = Method.Post;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as PUT endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      message = 'Hello World!';
     *      @Routing.Put('/')
     *      async putStatus(requestReader) {
     *          return new StatusResponseBuilder(StatusCodes.Ok, this.message);
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     * ```
     */
    static Put(route: string): MethodDecorator {
        const method = Method.Put;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as PATCH endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      message = 'Hello World!';
     *      @Routing.Patch('/')
     *      async patchStatus(requestReader) {
     *          return new StatusResponseBuilder(StatusCodes.Ok, this.message);
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     * ```
     */
    static Patch(route: string): MethodDecorator {
        const method = Method.Patch;
        return this.wrapInstanceless(method, route);
    }

    /**
     * Decorates a class method to bind it as DELETE endpoint when building an app
     * @static
     * @param {string} route - the route for the endpoint
     * @returns {function} the method decorator
     * @example
     * ```ts
     *  class Test {
     *      message = 'Hello World!';
     *      @Routing.Delete('/')
     *      async deleteStatus(requestReader) {
     *          return new StatusResponseBuilder(StatusCodes.Ok, this.message);
     *      }
     *  }
     *  
     *  // Later when adding apps to a server
     *  server.app(appProvider, '/test', Test);
     * ```
     */
    static Delete(route: string): MethodDecorator {
        const method = Method.Delete;
        return this.wrapInstanceless(method, route);
    }
}
