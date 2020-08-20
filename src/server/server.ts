import { AddressInfo } from 'net';
import { URL } from 'url';
import { App, RequestHead, Response, RequestReader, StatusResponseBuilder, Endpoint, SimpleApp, AppProvider, ProvidedFor } from '../app';
import { ClassType } from '../utils';
import { BeforeHook } from './request-reader';


export type AfterHook = (request: RequestHead, response: Response) => Response;


class EmptyApp extends App {
    constructor() {
        super('empty');
    }

    protected async digestRequest(requestReader: RequestReader, endpoint: Endpoint) {
        return await this.resolveNotFoundEndpoint(requestReader);
    }
}


export abstract class Server {
    abstract listen(port: number, onListening?: () => void): this;
    abstract stop(): Promise<{}>;
    abstract get isListening(): boolean;
    abstract get addressInfo(): AddressInfo | undefined;

    private _before: BeforeHook[] = [];
    private _after: AfterHook[] = [];
    private apps = new Map<string, App>();
    private emptyApp = new EmptyApp();

    private getAppFromRequest(requestReader: RequestReader): App {
        const name = requestReader.head.appName;
        return this.get(name || '/') || this.emptyApp;
    }

    protected getAppNameAndRoute(url: URL) {
        const fragments = url.pathname.split('/');
        return {
            appName: '/' + (fragments[1] || ''),
            route: '/' + fragments.slice(2).join('/')
        };
    }

    async resolve(requestReader: RequestReader): Promise<Response> {
        const app = this.getAppFromRequest(requestReader);

        // Resolution
        const responseBuilder = await app.resolve(requestReader);
        return responseBuilder.build();
    }

    get(name: string) {
        return this.apps.get(name);
    }

    app(app: App): this;
    app(appProvider: AppProvider, name: string): this;
    app(classType: ClassType): this;
    app(arg: App | AppProvider | ClassType, name?: string): this {
        let app: App;
        if (arg instanceof AppProvider) {
            if (!name) {
                throw new Error('An app-provider needs a name for building the real app');
            }
            app = arg.build(name);
        } else if (arg instanceof App) {
            app = arg as App;
        } else if (arg) {
            const metadata = ProvidedFor.getAppMetadata(arg);
            return this.app(metadata.appProvider, metadata.name as string);
        } else {
            throw new Error('Could not find an app in the provided parameters');
        }

        this.apps.set(app.name, app);
        return this;
    }

    before(hook: BeforeHook): this {
        this._before.push(hook);
        return this;
    }

    after(hook: AfterHook): this {
        this._after.push(hook);
        return this;
    }

    containsApp(app: App): boolean;
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

    getBeforeMiddleware(): BeforeHook {
        return request => {
            return this._before.reduce((request, hook) => {
                return hook(request);
            }, request);
        };
    }

    getAfterMiddleware(): AfterHook {
        return (request, response) => {
            return this._after.reduce((response, hook) => {
                return hook(request, response);
            }, response);
        };
    }
}
