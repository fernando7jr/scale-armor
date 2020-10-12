import { TraceableError } from "../app";
import { PaginatedData, PaginationOptions } from "../utils";
import { IdOptional, Model, ModelService } from "./model-service";
import { Id, Query } from "./query";

export const enum CrudMethods {
    Count = 'count',
    Find = 'find',
    Get = 'get',
    Create = 'create',
    Patch = 'patch',
    Put = 'put',
    Delete = 'delete'
}

export class InvalidModelError extends Error {
    private __crudMethod: CrudMethods;

    constructor(crudMethod: CrudMethods) {
        super(`The provided model is invalid for ${crudMethod}`);
        this.__crudMethod = crudMethod;
    }

    get crudMethod() {
        return this.__crudMethod;
    }
}

export class ModelMapError extends TraceableError {
    private __crudMethod: CrudMethods;

    constructor(what: string, crudMethod: CrudMethods, cause?: Error | any) {
        super(`${ModelMapError.name}:${crudMethod}`, what, cause);
        this.__crudMethod = crudMethod;
    }

    get crudMethod() {
        return this.__crudMethod;
    }
}


export abstract class ModelController<TModel extends Model<TId>, TId extends Id<unknown> = unknown> {
    private __modelService: ModelService<TModel>;

    constructor(modelService: ModelService<TModel>) {
        this.__modelService = modelService;
    }

    abstract validate(model: IdOptional<TModel>, crudMethod: CrudMethods.Create): boolean;
    abstract validate(model: IdOptional<TModel>, crudMethod: CrudMethods.Put): boolean;
    abstract validate(model: TModel, crudMethod: CrudMethods.Patch): boolean;

    abstract map(data: any[]): TModel[];

    private mapData(data: TModel[], crudMethod: CrudMethods): TModel[] {
        let mappedData: TModel[];
        try {
            mappedData = this.map(data);
        } catch (error) {
            throw new ModelMapError('Failed to map the data', crudMethod, error);
        }

        if (mappedData.length != data.length) {
            throw new ModelMapError(
                'The mapped data does not have the same length as the original data',
                crudMethod
            );
        }

        return mappedData;
    }

    async count(query?: Query<TModel, TId>): Promise<number> {
        return await this.__modelService.count(query || {});
    }

    async find(query?: Query<TModel, TId>, options?: Partial<PaginationOptions>): Promise<PaginatedData<TModel>> {
        const result = await this.__modelService.findAll(query || {}, options);
        result.data = this.mapData(result.data, CrudMethods.Find);
        return result;
    }

    async get(query?: Query<TModel, TId>): Promise<TModel | undefined> {
        const result = await this.__modelService.find(query || {});
        if (result === undefined) {
            return result;
        }
        return this.mapData([result], CrudMethods.Get)[0];
    }

    async create(model: IdOptional<TModel>): Promise<TModel | undefined> {
        const crudMethod = CrudMethods.Create;
        if (!this.validate(model, crudMethod)) {
            throw new InvalidModelError(crudMethod);
        }
        return await this.__modelService.create(model);
    }

    async put(model: TModel): Promise<TModel | undefined> {
        const crudMethod = CrudMethods.Put;
        if (!this.validate(model, crudMethod)) {
            throw new InvalidModelError(crudMethod);
        }
        return await this.__modelService.put(model);
    }

    async patch(model: TModel): Promise<TModel | undefined> {
        const crudMethod = CrudMethods.Patch;
        if (!this.validate(model, crudMethod)) {
            throw new InvalidModelError(crudMethod);
        }
        const id = model._id;
        return await this.__modelService.patch(id, model);
    }

    async delete(id: TId): Promise<boolean> {
        const result = await this.__modelService.deleteById(id);
        return result.deleted;
    }

    get dbName() {
        return this.__modelService.dbName;
    }

    get entityName() {
        return this.__modelService.entityName;
    }

    get serviceName() {
        return this.__modelService.serviceName;
    }
}
