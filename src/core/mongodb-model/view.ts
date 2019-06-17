import { Model, FindOneOptions, FindOptions } from "../persisted-model";
import { MongoDbModelService } from "./model";
import { ConstructorOf } from "../../utils";

export abstract class MongoDbModelView<T extends Model> extends MongoDbModelService<T> {
    protected abstract readonly projection: any;

    private __copyProjection() {
        return Object.assign({}, this.projection);
    }

    /**
     * Find one document by id
     *
     * @param {*} id
     * @param {FindOneOptions} [options]
     * @returns {(Promise<T | null>)}
     * @memberof MongoDbModelService
     */
    findById(id: any, options?: FindOneOptions): Promise<T | null> {
        const proj = this.__copyProjection();
        options = options || {} as FindOneOptions;
        options.projection = Object.assign(proj, options.projection || {});
        return super.findById(id, options);
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
        const proj = this.__copyProjection();
        options = options || {} as FindOneOptions;
        options.projection = Object.assign(proj, options.projection || {});
        return super.findOne(condition, options);
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
        const proj = this.__copyProjection();
        options = options || {} as FindOptions;
        options.projection = Object.assign(proj, options.projection || {});
        return super.find(condition, options);
    }

    /**
     * 
     *
     * @static
     * @template T
     * @param {string} collectionName
     * @param {*} projection
     * @returns
     * @memberof MongoDbModelView
     */
    static viewOf<T extends Model>(collectionName: string, projection: any) {
        return class extends MongoDbModelView<T> {
            projection = projection;

            constructor() {
                super(collectionName);
            }
        } as ConstructorOf<MongoDbModelView<T>>
    }
}
