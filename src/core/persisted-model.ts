/**
 * 
 *
 * @export
 * @interface Model
 */
export interface Model {
    _id?: string;
    [key: string]: any;
}

export interface FindOneOptions {
    projection: any;
}

export interface FindOptions extends FindOneOptions {
    page: number;
    pageSize: number;
}

/**
 * Model service for CRUD operations
 *
 * @export
 * @interface PersistedModelService
 * @template T
 */
export interface PersistedModelService<T extends Model> {
    name: string;
    create(data: T | T[]): Promise<T[]>;
    find(condition?: any, options?: Partial<FindOptions>): Promise<T[]>;
    findOne(condition?: any, options?: Partial<FindOneOptions>): Promise<T | null>;
    findById(id: any, options?: Partial<FindOneOptions>): Promise<T | null>;
    updateMany(condition: any, data: T): Promise<{}>;
    updateOne(condition: any, data: any): Promise<{}>;
    removeMany(condition: any): Promise<{}>;
    removeOne(condition: any): Promise<{}>;
    replaceOne(id: any, replacement: T): Promise<T>;
}


export interface PersistedModelServiceConstructor<T extends Model> {
    new (): PersistedModelService<T>;
}
