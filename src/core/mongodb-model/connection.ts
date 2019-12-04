import { createConnection, Model as MongooseModel, Schema, Document, set} from "mongoose";
import * as fs from "fs";
import { ConfigStorage } from "../config";


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
export class MongoDbConnection {
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
        const schema = fs.readFileSync(schemaName).toString();
        return JSON.parse(schema).data[0];
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
