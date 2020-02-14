import { PersistedModelService, Model, FindOptions } from '../persisted-model';
import { Model as MongooseModel, Document} from 'mongoose';
import { ObjectId } from 'bson';
import { FindOneOptions } from 'mongodb';
import { MongoDbConnection, MongoDbSchema } from './connection';


export { ObjectId } from 'bson';

/**
 * Persisted model service for MongoDB
 *
 * @export
 * @abstract
 * @class MongoDbModelService
 * @implements {PersistedModelService<T>}
 * @template T model interface
 */
export abstract class MongoDbModelService<T extends Model> implements PersistedModelService<T> {
    private __name: string;
    private __model: MongooseModel<Document>;

    /**
     * Creates an instance of MongoDbModelService.
     * @param {string} collectionName
     * @param {(MongoDbSchema | string)} [schema]
     * @memberof MongoDbModelService
     */
    constructor(collectionName: string, schema?: MongoDbSchema | string) {
        this.__name = collectionName;
        this.__model = MongoDbConnection.modelFor(
            this.__name,
            this.__name,
            schema
        );
    }

    public static Id(id?: string | ObjectId) {
        return new ObjectId(id);
    }

    protected static TryCastToId(id: string) {
        try {
            return this.Id(id);
        } catch (err) {
            return id;
        }
    }

    /**
     * Get the collection name
     *
     * @readonly
     * @memberof MongoDbModelService
     */
    get name() {
        return this.__name;
    }

    create(data: T | T[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.__model.create(Array.isArray(data) ? data : [data], (error: any, data: any) =>  {
                if (error) return reject(error);
                resolve(data);
            });
        })
    }

    /**
     * Find one document by id
     *
     * @param {*} id
     * @param {FindOneOptions} [options]
     * @returns {(Promise<T | null>)}
     * @memberof MongoDbModelService
     */
    findById(id: any, options?: Partial<FindOneOptions>): Promise<T | null> {
        options = options || {};
        const projection = options.projection;
        return new Promise((resolve, reject) => {
            if (typeof id === 'string') {
                id = MongoDbModelService.TryCastToId(id);
            }
            this.__model.findById(id, projection).lean().exec((error: any, data: any) =>  {
                if (error) return reject(error);
                else if (!data) return resolve(null);
                resolve(data);
            });
        });
    }

    /**
     * Find one document
     *
     * @param {*} [condition] mongoDB find query
     * @param {FindOneOptions} [options]
     * @returns {(Promise<T | null>)}
     * @memberof MongoDbModelService
     */
    findOne(condition?: any, options?: Partial<FindOneOptions>): Promise<T | null> {
        options = options || {};
        const projection = options.projection;
        return new Promise((resolve, reject) => {
            this.__model.findOne(condition, projection).lean().exec((error: any, data: any) => {
                if (error) return reject(error);
                resolve(data);
            });
        });
    }

    /**
     * Find
     *
     * @param {*} [condition]
     * @param {FindOptions} [options]
     * @returns {Promise<T[]>}
     * @memberof MongoDbModelService
     */
    find(condition?: any, options?: Partial<FindOptions>): Promise<T[]> {
        options = options || {} as FindOptions;
        const projection = options.projection;
        const page = options.page;
        const pageSize = options.pageSize;
        const limit = pageSize || 50;
        const skip = (page || 0) * limit;

        const sortBy = options.sortBy;
        const sortType = options.sortType || 1;
        const sort: any = {};
        if (sortBy) {
            sort[sortBy] = sortType;
        }

        return new Promise((resolve, reject) => {
            this.__model.find(condition, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec((error: any, data: any) => {
                    if (error) return reject(error);;
                    resolve(data);
                });
        });
    }

    updateMany(condition: any, data: T, options?: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.updateMany(condition, data, options).lean().exec((error: any, data: any) => {
                if (error) return reject(error);
                resolve(data);
            });
        });
    }

    updateOne(condition: any, data: any, options?: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.updateOne(condition, data, options, (error: any, data: any) => {
                if (error) return reject(error);
                resolve(data);
            });
        });
    }

    removeMany(condition: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.deleteMany(condition, (error: any) => {
                if (error) return reject(error);
                resolve();
            });
        });
    }

    removeOne(condition: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.deleteOne(condition, (error: any) => {
                if (error) return reject(error);
                resolve();
            });
        });
    }

    replaceOne(id: any, replacement: T): Promise<T> {
        return new Promise((resolve, reject) => {
            this.__model.replaceOne({_id: id}, replacement, (error: any) => {
                if (error) return reject(error);
                resolve(replacement);
            });
        });
    }

    /**
     * Aggregation
     *
     * @param {any[]} [aggregation] aggregation pipeline
     * @returns {Promise<any[]>}
     * @memberof MongoDbModelService
     */
    aggregate(aggregation?: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.__model.aggregate(aggregation).then(resolve).catch(reject);
        });
    }

    /**
     * Distinct
     *
     * @param {any[]} [distinction]
     * @returns {Promise<any[]>}
     * @memberof MongoDbModelService
     */
    distinct(distinction: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.__model.distinct(distinction).then(resolve).catch(reject);
        });
    }

    /**
     * Count
     *
     * @param {*} [condition]
     * @returns {Promise<T[]>}
     * @memberof MongoDbModelService
     */
    count(condition?: any): Promise<number> {
        
        return new Promise((resolve, reject) => {
            this.__model.find(condition)
                .countDocuments()
                .exec((error: any, data: any) => {
                    if (error) return reject(error);;
                    resolve(data);
                });
        });
    }
}
