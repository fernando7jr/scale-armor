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

export abstract class AppWrapper<TMethod extends Function = Function> {
    private endpointsProvider: EndpointsProvider;

    constructor(arg: EndpointsProvider) {
        this.endpointsProvider = arg;
    }

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

    private static registerBinding<T extends object>(target: T, binding: EndpointBinding<T>): void {
        const metadata = this.getOrCreateAppWrapperMetadata(target);
        metadata.bindings.push(binding);
    }

    protected static decorateClassMethod<T extends Object>(
        target: T | any,
        endpointBinding: EndpointBinding<T>
    ): void {
        if (!target || !(target instanceof Object) || Array.isArray(target)) {
            throw new Error('Can not decorate a non-compatible object');
        }

        this.registerBinding(target, endpointBinding);
    }

    static bindTargetToAppProvider<T extends Object>(target: T, appProvider: AppProvider): AppProvider {
        if (!target || !(target instanceof Object) || Array.isArray(target)) {
            throw new Error('Can not bind to a non-compatible object');
        }

        return new BoundAppProvider(target, appProvider);
    }

    protected injectEndpoint(endpoint: Endpoint): void {
        this.endpointsProvider.endpoint(endpoint);
    }

    protected abstract wrapEndpoint(method: Method, route: string, prop: TMethod): this;
}
