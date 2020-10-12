import { Method } from "../router";
import { ClassType } from "../utils";
import { Endpoint, EndpointsProvider, EndpointCallback } from "./endpoint";
import { AppProvider } from "./app";


type EndpointBinding<T extends object> = (endpointsProvider: EndpointsProvider, target: T) => void;
const appWrapperMetadataSymbol = Symbol('scar:appWrapperMetadata');
interface AppWrapperMetadata<T extends object> {
    bindings: EndpointBinding<T>[];
}

class BoundAppProvider extends AppProvider {
    private targetBindedSymbol = Symbol('scar:targetBinded');

    constructor(private target: object, private appProvider: AppProvider) {
        super();
    }

    build(name: string) {
        const targetPrototype = Reflect.getPrototypeOf(this.target) as ClassType;
        const metadata: AppWrapperMetadata<object> = Reflect.get(targetPrototype, appWrapperMetadataSymbol);
        if (!metadata || !Array.isArray(metadata.bindings)) {
            throw new Error('Can not bind to a non-compatible object');
        }

        const app = this.appProvider.build(name);
        Reflect.set(app, this.targetBindedSymbol, this.target);
        const { bindings } = metadata;
        for (const build of bindings) {
            build(app, this.target);
        }

        return app;
    }
};

/**
 * AppWrapper manipulates a given EndpointsProvider to inject endpoints and add handlers
 * They create a new layer isolating functionality from the apps
 * @class
 */
export abstract class AppWrapper<TMethod extends Function = Function> {
    private endpointsProvider: EndpointsProvider;

    /**
     * @constructor
     * @param endpointsProvider - the endpoints-provider
     */
    constructor(endpointsProvider: EndpointsProvider) {
        this.endpointsProvider = endpointsProvider;
    }

    /**
     * Get or create metadata from a target object and return it
     * @static
     * @param target - target object to be infused with metadata
     * @returns the infused metadata
     */
    private static getOrCreateAppWrapperMetadata<T extends object>(target: T): AppWrapperMetadata<T> {
        const targetPrototype = Reflect.getPrototypeOf(target) as ClassType;
        let metadata: AppWrapperMetadata<T> = Reflect.get(targetPrototype, appWrapperMetadataSymbol);
        if (!metadata) {
            metadata = {
                bindings: []
            };
            Reflect.set(targetPrototype, appWrapperMetadataSymbol, metadata);
        } else if (!Array.isArray(metadata.bindings)) {
            metadata.bindings = [];
        }
        return metadata;
    }

    /**
     * Binds an endpoint to an object
     * @static
     * @param target - the target object
     * @param binding - the binding to be infused into the object metadata
     */
    private static registerBinding<T extends object>(target: T, binding: EndpointBinding<T>): void {
        const metadata = this.getOrCreateAppWrapperMetadata(target);
        metadata.bindings.push(binding);
    }

    /**
     * Decorate a an static binding into the target
     * @static
     * @param target - the target object
     * @param endpointBinding - the binding to be infused into the object metadata
     */
    protected static decorateClassMethod<T extends Object>(
        target: T | any,
        endpointBinding: EndpointBinding<T>
    ): void {
        if (!target || !(target instanceof Object) || Array.isArray(target)) {
            throw new Error('Can not decorate a non-compatible object');
        }

        this.registerBinding(target, endpointBinding);
    }

    /**
     * Bind the given AppProvider to build an app using the target infused metadata
     * The AppProvider passed as parameter will retain it is previous definitions. However they can be overrided by the target bindings
     * @param target - the target object
     * @param appProvider - the app-provider to be used as base
     */
    static bindTargetToAppProvider<T extends Object>(target: T, appProvider: AppProvider): AppProvider {
        if (!target || !(target instanceof Object) || Array.isArray(target)) {
            throw new Error('Can not bind to a non-compatible object');
        }

        return new BoundAppProvider(target, appProvider);
    }

    /**
     * Inject an endpoint into the endpoints-provider
     * @param endpoint - the endpoint to be injected
     */
    protected injectEndpoint(endpoint: Endpoint): void {
        this.endpointsProvider.endpoint(endpoint);
    }

    /**
     * Wrap an endpoint to allow addiotional behaviours and handlings
     * @param method - the method to construct the endpoint
     * @param route - the route to construct the endpoint
     * @param prop - the value to be used as the endpoint callback after wrapping
     * @returns @this
     */
    protected abstract wrapEndpoint(method: Method, route: string, prop: TMethod): this;
}
