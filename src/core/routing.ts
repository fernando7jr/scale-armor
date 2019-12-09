import { 
    ServiceMethods,
    Id,
    Params,
    Paginated,
    NullableId,
    HookContext,
    HooksObject,
    HookMap
} from "@feathersjs/feathers";
import { GeneralError } from "@feathersjs/errors";
// import "reflect-metadata";

export type RequestParams<TUser=any> = Params & {
    headers: {
        [key: string]: string | undefined;
        host?: string;
        connection?: string;
        "cache-control"?: string;
        accept?: string;
        "upgrade-insecure-requests"?: string;
        "user-agent"?: string;
        "accept-encoding"?: string;
        "accept-language"?: string;
    },
    user?: TUser
};

export type ServiceHookContext = HookContext & {params: RequestParams};
export type ServiceHookFunction = (context: ServiceHookContext) => Promise<ServiceHookContext> | Promise<void>;
export interface ServiceHook {
    create?: ServiceHookFunction[];
    find?: ServiceHookFunction[];
    get?: ServiceHookFunction[];
    patch?: ServiceHookFunction[];
    remove?: ServiceHookFunction[];
    update?: ServiceHookFunction[];
    all?: ServiceHookFunction[];
}

export interface ServiceRoute<T> extends ServiceMethods<T> {
    name: string;
    before?: ServiceHook,
    after?: ServiceHook,
    error?: ServiceHook
}

export interface ScaleArmorPaginated<T> {
    data: T[]|any,
    page: number,
    lastPage: number,
    total: number
}

export type FindMethod<T> = (params?: RequestParams) => Promise<T[] | Paginated<T>| ScaleArmorPaginated<T>>;
export type FindPostMethod<T> = (data: Partial<T>, params?: RequestParams) => Promise<T[] | Paginated<T>| ScaleArmorPaginated<T>>;
export type GetMethod<T> = (id: Id, params?: RequestParams) => Promise<T>;
export type CreateMethod<T> = (data: Partial<T> | Array<Partial<T>>, params?: RequestParams) => Promise<T | T[]>;
export type UpdateMethod<T> = (id: NullableId, data: T, params?: RequestParams) => Promise<T>;
export type PatchMethod<T> = (id: NullableId, data: Partial<T>, params?: RequestParams) => Promise<T>;
export type RemoveMethod<T> = (id: NullableId, params?: RequestParams) => Promise<T>;
export type ServiceMethod<T> = FindMethod<T> |
                               FindPostMethod<T> |
                               GetMethod<T> | 
                               CreateMethod<T> | 
                               UpdateMethod<T> | 
                               PatchMethod<T> | 
                               RemoveMethod<T>;


export enum Method {
    Find,
    FindPost,
    Get,
    Create,
    Update,
    Patch,
    Remove
}
export interface Endpoint extends Function {
    method: Method;
    route: string;
    isEndpoint: true;
}
export type ServiceEndpoint<T> = Endpoint & ServiceMethod<T>;


function getAllEndpoints(instance: any): ServiceEndpoint<any>[] {
    let props: any = {};
    let obj: any = instance;
    do {
        Object.getOwnPropertyNames(obj).forEach(name => {props[name] = true})
    } while (obj = Object.getPrototypeOf(obj));
    
    return Object.keys(props).filter(function(e) { 
       return e && !e.startsWith("__") && instance[e] && instance[e].isEndpoint;
    }).map(key => instance[key]);
}


export class HookBuilder {
    private hooks: Partial<HooksObject> = {};
    private _this: any;
    constructor (_this?: any) {
        this._this = _this;
    }

    private __getOn(on?: string | string[]): string[] {
        on = on || [];
        on = Array.isArray(on) ? on : on.split(' ');
        return on.length ? on : ['all'];
    }

    private __addHook(_this: any, map: HookMap, hook: ServiceHookFunction, on?: string | string[]): HookBuilder {
        _this = _this || this._this
        this.__getOn(on).forEach(item => {
            (<any>map)[item] = function () {
                return hook.apply(_this, <any>arguments);
            };
        });
        return this;
    }

    private __getHookMap(name: string): HookMap {
        if (!(<any>this.hooks)[name]) {
            (<any>this.hooks)[name] = {};
        }
        return (<any>this.hooks)[name];
    }

    before(hook?: ServiceHookFunction, on?: string | string[], _this?: any): HookBuilder {
        if (!hook) return this;
        return this.__addHook(_this, this.__getHookMap('before'), hook, on);
    }

    after(hook?: ServiceHookFunction, on?: string | string[], _this?: any): HookBuilder {
        if (!hook) return this;
        return this.__addHook(_this, this.__getHookMap('after'), hook, on);
    }

    error(hook?: ServiceHookFunction, on?: string | string[], _this?: any): HookBuilder {
        if (!hook) return this;
        return this.__addHook(_this, this.__getHookMap('error'), hook, on);
    }

    end(): Partial<HooksObject> {
        const result = this.hooks;
        this.hooks = {};
        return result;
    }
}


export class Routing {
    private static __toEndpoint<T>(route: string, method: Method, func: ServiceMethod<T>): ServiceEndpoint<T> {
        const endpoint: ServiceEndpoint<T> = <any>func;
        endpoint.route = route;
        endpoint.method = method;
        endpoint.isEndpoint = true;
        return endpoint;
    }

    private static __decorator(route: string, method: Method) {
        return (target: any, propertyName: string, type: TypedPropertyDescriptor<any>) => {
            const func = target[propertyName];
            return this.__toEndpoint(route, method, func);
        }
    }
    public static Create(route: string) {
        return this.__decorator(route, Method.Create) as any;
    }
    public static Find(route: string) {
        return this.__decorator(route, Method.Find) as any;
    }
    public static Get(route: string) {
        return this.__decorator(route, Method.Get) as any;
    }
    public static Patch(route: string) {
        return this.__decorator(route, Method.Patch) as any;
    }
    public static Remove(route: string) {
        return this.__decorator(route, Method.Remove) as any;
    }
    public static Update(route: string) {
        return this.__decorator(route, Method.Update) as any;
    }

    private __name: string;
    private __endpoints: ServiceEndpoint<any>[] = [];
    private __remoteMethods: {[key: string]: ServiceEndpoint<any>} = {};
    protected before: ServiceHookFunction | undefined = undefined;
    protected after: ServiceHookFunction | undefined = undefined;
    constructor(name?: string) {
        if (name && !name.startsWith("/")) {
            name = "/" + name;
        }
        if (name && name.endsWith("/")) {
            name = name.slice(0, name.length - 1);
        }
        this.__name = name || "";
    }

    protected __registerEndpoint<T>(endpoint: ServiceEndpoint<T>): void {
        this.__endpoints.push(<any>endpoint);
    }

    protected __registerAll(): Routing {
        getAllEndpoints(this).forEach(e => {
            this.__registerEndpoint(e);
        });
        return this;
    }

    public get name() {
        return this.__name;
    }

    protected __applyEndpointToService(service: ServiceRoute<any>, endpoint: ServiceEndpoint<any>): void {
        const self = this;
        const func = (...args: any[]) => {
            return endpoint.apply(self, args);
        };
        switch (endpoint.method) {
            case Method.Create:
                service.create = <CreateMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.create = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.create = [this.after];
                // }
                break;
            case Method.Find:
                service.find = <FindMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.find = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.find = [this.after];
                // }
                break;
            case Method.Get:
                service.get = <GetMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.get = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.get = [this.after];
                // }
                break;
            case Method.Patch:
                service.patch = <PatchMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.patch = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.patch = [this.after];
                // }
                break;
            case Method.Remove:
                service.remove = <RemoveMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.remove = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.remove = [this.after];
                // }
                break;
            case Method.Update:
                service.update = <UpdateMethod<any>>func;
                // if (this.before && service.before) {
                //     service.before.update = [this.before];
                // }
                // if (this.after && service.after) {
                //     service.after.update = [this.after];
                // }
                break;
            default:
                throw new Error("Unexpected method " + endpoint.method);
        }
    }

    public getEndpoints(): {[name: string]: ServiceRoute<any>} {
        if (!this.__endpoints.length) {
            this.__registerAll();
        }
        const applyEndpointToService = (endpoint: ServiceEndpoint<any>) => {
            const route = this.name + endpoint.route;
            if (!services[route]) {
                // services[route] = <any>{name: route, before: {}, after: {}};
                services[route] = <any>{name: route};
            }
            const service = services[route];
            this.__applyEndpointToService(service, endpoint);
        };

        const services: {[name: string]: ServiceRoute<any>} = {};
        
        Object.values(this.__remoteMethods).forEach(applyEndpointToService);
        this.__endpoints.forEach(applyEndpointToService);
        
        return services;
    }

    public applyRemoteMethod<T>(route: string, method: Method, func: ServiceMethod<T>): void {
        const endpoint = Routing.__toEndpoint<T>(route, method, func);
        const key = `ROUTE:${route}@${method}`;
        this.__remoteMethods[key] = <ServiceEndpoint<any>>endpoint;
    }

    public applyRemoteMethods<T>(rm: {route: string, method: Method, func: ServiceMethod<T>}[]): void {
        rm.forEach(e => {
            this.applyRemoteMethod(e.route, e.method, e.func);
        });
    }

    public error = (context: ServiceHookContext): any => {
        if (context.error) {
            if (!context.error.code) {
                context.error = new GeneralError('Internal Server Error');
            }
            // context.result = error;
            return context;
        }
    } 

    public get hooks(): Partial<HooksObject> {
        const builder = new HookBuilder(this)
        builder.before(this.before).after(this.after).error(this.error);
        return builder.end();
    }
}


export interface RoutingConstructor {
    new (name?: string): Routing;
}
