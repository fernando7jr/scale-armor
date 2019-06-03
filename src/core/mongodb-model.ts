import { PersistedModel, Model } from "./persisted-model";
import { createConnection, model, Model as MongooseModel, Schema, Document, set} from "mongoose";
import * as fs from "fs";
import { ObjectId } from "bson";
import { ConfigStorage } from "./config";


export { ObjectId } from "bson";


export interface MongoDbSchema {
    [key: string]: "string" | "number" | 
    "boolean" | "array" | "buffer" | 
    "date" | "ObjectId" | "mixed";
}


class MongoDbConnection {
    private static __inited = false;
    private static models: {[key: string]: {model: MongooseModel<Document>, schema: MongoDbSchema}} = {};

    private static init() {
        if (this.__inited) {
            return;
        }
        this.__inited = true;
        set('useFindAndModify', false)
    }

    static connect() {
        this.init();
        const params = {dbName: "ochefegastronomia", useNewUrlParser: true};
        const mongouri = ConfigStorage.get('mongodb');
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


export abstract class MongoDbModel<T extends Model> implements PersistedModel<T> {
    private __name: string;
    private __model: MongooseModel<Document>;

    constructor(name: string, schema?: MongoDbSchema | string) {
        this.__name = name;
        this.__model = MongoDbConnection.modelFor(this.__name, this.__name, schema);
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

    findById(id: any, projection?: any): Promise<T | null> {
        return new Promise((resolve, reject) => {
            if (typeof id === 'string') {
                id = MongoDbModel.TryCastToId(id);
            }
            this.__model.findById(id, projection).lean().exec((error: any, data: any) =>  {
                if (error) return reject(error);
                else if (!data) return resolve(null);
                resolve(data);
            });
        });
    }

    findOne(condition?: any, projection?: any): Promise<T | null> {
        return new Promise((resolve, reject) => {
            this.__model.findOne(condition, projection).lean().exec((error: any, data: any) => {
                if (error) return reject(error);
                resolve(data);
            });
        });
    }

    find(condition?: any, projection?: any): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.__model.find(condition, projection).lean().exec((error: any, data: any) => {
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

    aggregate(aggregation?: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.__model.aggregate(aggregation).then(resolve).catch(reject);
        });
    }
}
