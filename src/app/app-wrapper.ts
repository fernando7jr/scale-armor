import { Method } from "../router";
import { AppProvider, App } from "./app";
import { Endpoint } from "./endpoint";

export abstract class AppWrapper<T = Function> {
    private appProvider: AppProvider;

    constructor(app: App);
    constructor(app: AppProvider);
    constructor(arg: App | AppProvider) {
        if (arg instanceof App) {
            this.appProvider = { app: arg };
        } else {
            this.appProvider = arg;
        }
    }

    protected decorate(route: string, method: Method): MethodDecorator {
        return (target: any, propertyName: string | symbol, type: TypedPropertyDescriptor<any>) => {
            if (!target || !(target instanceof Object) || Array.isArray(target)) {
                throw new Error('Can not decorate a non-compatible object');
            }

            const prop: T = target[propertyName];

            this.wrapEndpoint(method, route, prop);
            return prop;
        };
    }

    protected injectEndpoint(endpoint: Endpoint): void {
        this.appProvider.app.endpoint(endpoint);
    }

    protected abstract wrapEndpoint(method: Method, route: string, prop: T): this;

    protected wrap(method: Method, route: string, func?: T): MethodDecorator | this {
        if (!func) {
            return this.decorate(route, method);
        }
        return this.wrapEndpoint(method, route, func);
    }
}