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
    find(condition?: any, projection?: any): Promise<T[]>;
    findOne(condition?: any, projection?: any): Promise<T | null>;
    findById(id: any, projection?: any): Promise<T | null>;
    updateMany(condition: any, data: T): Promise<{}>;
    updateOne(condition: any, data: any): Promise<{}>;
    removeMany(condition: any): Promise<{}>;
    removeOne(condition: any): Promise<{}>;
    replaceOne(id: any, replacement: T): Promise<T>;
}


export interface PersistedModelServiceConstructor<T extends Model> {
    new (): PersistedModelService<T>;
}
