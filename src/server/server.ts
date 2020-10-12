import { AddressInfo } from 'net';
import { URL } from 'url';
import { App, RequestHead, Response, RequestReader, Endpoint, AppProvider, AppWrapper } from '../app';
import { BeforeHook } from './request-reader';


/** 
 * AfterHook callback
 * It is executed after the endpoint is resolved
 */
export type AfterHook = (request: RequestHead, response: Response) => Response;


class EmptyApp extends App {
    constructor() {
        super('empty');
    }

    protected async digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return await this.resolveNotFoundEndpoint(requestReader);
    }
}

/**
 * Server class
 * Direct incoming requests to apps and return the response back to the client
 * Each server can have their own before/after middlewares
 * @class
 * @abstract
 */
export abstract class Server {
    /**
     * Puts the server to listen at the given port
     * If provided. The callback onListening is called when the server is ready to receive requests
     * @abstract
     * @param port - the port to listen on
     * @param onListening - a callback for when the server is ready to receive requests
     */
    abstract listen(port: number, onListening?: () => void): this;
    /**
     * Stops the server from receiving any further incoming requests
     * @async
     * @abstract
     * @returns an empty promise for when the server has completely stopped
     */
    abstract stop(): Promise<{}>;
    /**
     * Get if the server is already listening to requests
     * @abstract
     */
    abstract get isListening(): boolean;
    /**
     * Get the AddressInfo which the server is listening on
     * @abstract
     * @returns the AddressInfo or undefined when the server is not listening yet
     */
    abstract get addressInfo(): AddressInfo | undefined;

    private _before: BeforeHook[] = [];
    private _after: AfterHook[] = [];
    private apps = new Map<string, App>();
    private emptyApp = new EmptyApp();

    /**
     * Resolves the request to an app and return it
     * @param requestReader - the request-reader
     * @returns the resolved app or an EmptyApp if none were found for this request-reader
     */
    private getAppFromRequest(requestReader: RequestReader): App {
        const name = requestReader.head.appName;
        return this.get(name || '/') || this.emptyApp;
    }

    /**
     * Get the App name from the url
     * @param url - an URL object from the request
     * @returns the appName and the route extracted from the URL
     */
    protected getAppNameAndRoute(url: URL) {
        const fragments = url.pathname.split('/');
        return {
            appName: '/' + (fragments[1] || ''),
            route: '/' + fragments.slice(2).join('/')
        };
    }

    /**
     * Resolves a request completely and return the response to the client
     * @async
     * @param requestReader - the request-reader
     * @returns the build Response ready for the client
     */
    async resolve(requestReader: RequestReader): Promise<Response> {
        const app = this.getAppFromRequest(requestReader);

        // Resolution
        const responseBuilder = await app.resolve(requestReader);
        return responseBuilder.build();
    }

    /**
     * Get an app by name
     * @param name - the name of the desired app
     * @returns the app or undefined
     */
    get(name: string): App | undefined {
        return this.apps.get(name);
    }

    /**
     * Build an App from a AppProvider
     * A name is required otherwise it will throw an Error
     * @param appProvider - the app-provider
     * @param name - the app name
     * @returns the built app
     */
    private buildApp(appProvider: AppProvider, name?: string): App {
        if (!name) {
            throw new Error('An app-provider needs a name for building the real app');
        }
        return appProvider.build(name);
    }

    /**
     * Add an App to @this server
     * @param app - the app to be added
     * @returns @this
     */
    app(app: App): this;
    /**
     * Add an App to @this server
     * @param appProvider - the app-provider to build the app
     * @param name - the name to be used by the app
     * @returns @this
     */
    app(appProvider: AppProvider, name: string): this;
    /**
     * Add an App to @this server
     * An object provided by bindTo is used to wrap the app-provider into injecting its bindings to the built app
     * @param appProvider - the app-provider to build the app
     * @param name - the name to be used by the app
     * @param bindTo - the object to bind the app-provider
     * @returns @this
     */
    app(appProvider: AppProvider, name: string, bindTo: object): this;
    app(arg: App | AppProvider, name?: string, bindTo?: object): this {
        let app: App;
        if (arg instanceof AppProvider) {
            if (bindTo) {
                arg = AppWrapper.bindTargetToAppProvider(bindTo, arg);
            }
            app = this.buildApp(arg, name);
        } else if (arg instanceof App) {
            app = arg as App;
        } else {
            throw new Error('Could not find an app in the provided parameters');
        }

        this.apps.set(app.name, app);
        return this;
    }

    /**
     * Add a before hook
     * @param hook - callback
     * @returns @this
     */
    before(hook: BeforeHook): this {
        this._before.push(hook);
        return this;
    }

    /**
     * Add a after hook
     * @param hook - callback
     * @returns @this
     */
    after(hook: AfterHook): this {
        this._after.push(hook);
        return this;
    }

    /**
     * Check if the app is contained in the instance
     * @param app - the app to be checked
     */
    containsApp(app: App): boolean;
    /**
     * Check if there is an app with the given name
     * @param name - the name of the app
     */
    containsApp(name: string): boolean;
    containsApp(arg: App | string): boolean {
        let name: string;;
        if (arg instanceof App) {
            name = arg.name;
        } else {
            name = arg + '';
        }

        return this.apps.has(name);
    }

    /**
     * Get a callback which process all before hooks in order
     * @returns a reducer for the stored before hooks
     */
    getBeforeMiddleware(): BeforeHook {
        return request => {
            return this._before.reduce((request, hook) => {
                return hook(request);
            }, request);
        };
    }

    /**
     * Get a callback which process all before hooks in order
     * @returns a reducer for the stored after hooks
     */
    getAfterMiddleware(): AfterHook {
        return (request, response) => {
            return this._after.reduce((response, hook) => {
                return hook(request, response);
            }, response);
        };
    }
}
