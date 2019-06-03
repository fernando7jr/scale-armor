import { Id, NullableId } from "@feathersjs/feathers";
import { 
    GetMethod, 
    FindMethod, 
    CreateMethod, 
    UpdateMethod, 
    RemoveMethod, 
    PatchMethod, 
    ServiceMethod, 
    RequestParams, 
    Method, 
    Routing
} from "./routing";
import { PersistedModelConstructor, PersistedModel } from "./persisted-model";
import { NotFound, BadRequest } from "@feathersjs/errors";


export interface RoutingAnyConstructor {
    new(...args: any[]): Routing;
}

export class CRUD<T> {
    private __modelConstructor: PersistedModelConstructor<T>;
    constructor (modelConstructor: PersistedModelConstructor<T>) {
        this.__modelConstructor = modelConstructor;
    }

    static for<T>(route: string, modelConstructor: PersistedModelConstructor<T>, allowedMethods?: Method[]) {
        return new CRUD(modelConstructor).forRoute(route, allowedMethods);
    }
    
    newModel() {
        return new this.__modelConstructor();
    }

    protected getQuery(params?: RequestParams): any {
        return params ? params.query : undefined;
    }

    private async get(id: Id, params?: RequestParams) {
        const model = this.newModel();
        const entry = await model.findById(id, this.getQuery(params));
        if (!entry) {
            throw new NotFound(`${model.name} not found for ${id}`);
        }
        return entry;
    }

    private async find(params?: RequestParams) {
        const model = this.newModel();
        return await model.find(this.getQuery(params));
    }

    private async create(data: Partial<T> | Array<Partial<T>>, params?: RequestParams) {
        const model = this.newModel();
        return await model.create(<T | T[]>data);
    }

    private async update(id: NullableId, data: T, params?: RequestParams) {
        const model = this.newModel();
        const query = id ? {_id: id} : this.getQuery(params);
        await model.updateOne(query, data);
        return <any>"ok";
    }

    private async patch(id: NullableId, data: Partial<T>, params?: RequestParams) {
        const model = this.newModel();
        if (!id) {
            throw new BadRequest(`Invalid id '${id}' for ${model.name}`);
        }
        return await model.replaceOne(id, <T>data);
    }

    private async remove(id: NullableId, params?: RequestParams) {
        const model = this.newModel();
        const query = id ? {_id: id} : this.getQuery(params);
        await model.removeOne(query);
        return <any>"ok";
    }

    Get(route: string): {route: string, method: Method, func: GetMethod<T>} {
        return {
            route: route,
            method: Method.Get,
            func: (id: Id, params?: RequestParams) => this.get(id, params)
        }
    }

    Find(route: string): {route: string, method: Method, func: FindMethod<T>} {
        return {
            route: route,
            method: Method.Find,
            func: (params?: RequestParams) => this.find(params)
        }
    }

    Create(route: string): {route: string, method: Method, func: CreateMethod<T>} {
        return {
            route: route,
            method: Method.Create,
            func: (data: Partial<T> | Array<Partial<T>>, params?: RequestParams) => this.create(data, params)
        }
    }

    Update(route: string): {route: string, method: Method, func: UpdateMethod<T>} {
        return {
            route: route,
            method: Method.Update,
            func: (id: NullableId, data: T, params?: RequestParams) => this.update(id, data, params)
        }
    }

    Patch(route: string): {route: string, method: Method, func: PatchMethod<T>} {
        return {
            route: route,
            method: Method.Patch,
            func: (id: NullableId, data: Partial<T>, params?: RequestParams) => this.patch(id, data, params)
        }
    }

    Remove(route: string): {route: string, method: Method, func: RemoveMethod<T>} {
        return {
            route: route,
            method: Method.Remove,
            func: (id: NullableId, params?: RequestParams) => this.remove(id, params)
        }
    }

    forRoute(route: string, allowedMethods?: Method[]) {
        if (!Array.isArray(allowedMethods) || !allowedMethods.length) {
            allowedMethods = [
                Method.Create,
                Method.Find,
                Method.Get,
                Method.Patch,
                Method.Remove,
                Method.Update
            ];
        }
        return allowedMethods.reduce((arr: {route: string, method: Method, func: ServiceMethod<T>}[], method) => {
            let endpoint: {route: string, method: Method, func: ServiceMethod<T>};
            switch (method) {
                case Method.Create:
                    endpoint = this.Create(route);
                    arr.push(endpoint);
                    break;
                case Method.Find:
                    endpoint = this.Find(route);
                    arr.push(endpoint);
                    break;
                case Method.Get:
                    endpoint = this.Get(route);
                    arr.push(endpoint);
                    break;
                case Method.Patch:
                    endpoint = this.Patch(route);
                    arr.push(endpoint);
                    break;
                case Method.Remove:
                    endpoint = this.Remove(route);
                    arr.push(endpoint);
                    break;
                case Method.Update:
                    endpoint = this.Update(route);
                    arr.push(endpoint);
                    break;
            }
            return arr;
        }, []);
    }
}


export function CRUDMethods<M>(route: string, modelConstructor: PersistedModelConstructor<M>, allowedMethods?: Method[]) {
    return function <T extends RoutingAnyConstructor>(constructor: T) {
        return <T>class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                const endpoints = CRUD.for(route, modelConstructor, allowedMethods);
                this.applyRemoteMethods(endpoints);
            }
        }
    };
}
