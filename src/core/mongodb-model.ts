import { PersistedModelService, Model, FindOptions } from "./persisted-model";
import { createConnection, Model as MongooseModel, Schema, Document, set} from "mongoose";
import * as fs from "fs";
import { ObjectId } from "bson";
import { ConfigStorage } from "./config";
import { FindOneOptions } from "mongodb";


export { ObjectId } from "bson";

/**
 * Schema for validating and constraint enforcing
 *
 * @export
 * @interface MongoDbSchema
 */
export interface MongoDbSchema {
    [key: string]: "string" | "number" | 
    "boolean" | "array" | "buffer" | 
    "date" | "ObjectId" | "mixed";
}

/**
 * Connection helper class
 *
 * @class MongoDbConnection
 */
class MongoDbConnection {
    private static __inited = false;
    private static models: {[key: string]: {model: MongooseModel<Document>, schema: MongoDbSchema}} = {};

    private static init() {
        if (this.__inited) {
            return;
        }
        this.__inited = true;
        set('useFindAndModify', false);
    }

    static connect() {
        this.init();
        const mongouri = ConfigStorage.get('mongodbUri');
        const dbName = ConfigStorage.get('mongodbDatabaseName') || 'local';
        const params = {dbName: dbName, useNewUrlParser: true};
        return createConnection(mongouri, params);
    }

    static loadSchema(schemaName: string): MongoDbSchema {
        return fs.readFileSync(schemaName).toJSON().data[0];
    }

    static translateSchema(schema: MongoDbSchema) {
        const types = {
            string: Schema.Types.String,
            number: Schema.Types.Number,
            boolean: Schema.Types.Boolean,
            array: Schema.Types.Array,
            buffer: Schema.Types.Buffer,
            date: Schema.Types.Date,
            ObjectId: Schema.Types.ObjectId,
            mixed: Schema.Types.Mixed
        };
        const _default = Schema.Types.Mixed;
        return new Schema(Object.keys(schema).reduce((obj: any, key) => {
            obj[key] = types[schema[key]] || _default;
            return obj;
        }, {}));
    }

    static modelFor(name: string, collectioName?: string, schematics?: any | string): MongooseModel<Document> {
        let model = this.models[name];
        if (model) {
            return model.model;
        } 
        if (schematics) {
            if (typeof schematics !== "string") {
                schematics = this.loadSchema(schematics);
            }
            schematics = this.translateSchema(schematics);
        } else {
            schematics = new Schema({}, {strict: false});
        }
        const connection = this.connect();
        model = {
            model: connection.model(name, schematics, collectioName, ),
            schema: schematics
        };
        this.models[name] = model;
        return model.model;
    }

    static modelByName(name: string) {
        return this.models[name].model;
    }
}

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

    findById(id: any, options?: FindOneOptions): Promise<T | null> {
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
    findOne(condition?: any, options?: FindOneOptions): Promise<T | null> {
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
    find(condition?: any, options?: FindOptions): Promise<T[]> {
        options = options || {} as FindOptions;
        const projection = options.projection;
        const page = options.pageSize;
        const pageSize = options.pageSize;

        const limit = pageSize || 50;
        const skip = (page || 0) * limit;

        return new Promise((resolve, reject) => {
            this.__model.find(condition, projection)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec((error: any, data: any) => {
                    if (error) return reject(error);;
                    resolve(data);
                });
        });
    }

    updateMany(condition: any, data: T): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.updateMany(condition, data).lean().exec((error: any, data: any) => {
                if (error) return reject(error);
                resolve(data);
            });
        });
    }

    updateOne(condition: any, data: any): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.__model.updateOne(condition, data, (error: any, data: any) => {
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
}
