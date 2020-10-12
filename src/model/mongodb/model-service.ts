import { ClientSession, Cursor as __Cursor, Db, MongoClient, Collection } from 'mongodb';
import { PaginatedData, PaginationOptions } from '../../utils';
import { Cursor, DeleteResult, IdLess, Model, ModelService, IdOptional, ReplaceResult, Transaction, UpdateResult, InsertOrUpdateResult } from '../model-service';
import { Id, Query, UpdateQuery } from '../query';
import { MongoDbCursor } from './cursor';
import { MongoDbTransaction } from './transaction';
import { MongoDbTranslater } from './translater';

export class MongoDbModelService<T extends Model<TId>, TId extends Id<unknown> = unknown> implements ModelService<T, TId> {
    private translater = new MongoDbTranslater<T, TId>();
    private __inited = false;

    constructor(
        private databaseName: string,
        private collectionName: string,
        private client: MongoClient) { }

    private async connect() {
        const connection = await this.client.connect();
        const db = connection.db(this.databaseName);

        await this.__ensureInitialization(db);

        const collection = db.collection<
            T>(this.collectionName, {
                strict: false,
            });

        return {
            conn: connection,
            db,
            collection,
        };
    }

    private async __ensureInitialization(db: Db) {
        if (!this.__inited) {
            const collections = await db.collections();
            if (!collections.some(c => c.collectionName === this.collectionName)) {
                await db.createCollection(this.collectionName);
            }
            this.__inited = true;
        }
    }

    withTransaction(callback: (transaction: Transaction) => Promise<void>): void {
        this.client.connect().then(async connection => {
            await connection.withSession(async mongoDbSession => {
                const transaction = new MongoDbTransaction(mongoDbSession);
                await callback(transaction);
            });
        });
    }

    private getOptionsAndTransaction(arg1?: Partial<PaginationOptions> | Transaction, arg2?: Transaction) {
        let options: Partial<PaginationOptions> = {};
        let transaction: Transaction | undefined = undefined;
        if (arg1 && arg2) {
            options = arg1 as Partial<PaginationOptions>;
            transaction = arg2;
        } else if (arg1) {
            if (arg1 instanceof Transaction) {
                transaction = arg1;
            } else {
                options = arg1;
            }
        }
        let session: ClientSession | undefined = undefined;
        if (transaction) {
            if (!(transaction instanceof MongoDbTransaction)) {
                throw new Error('Incompatible transaction type');
            }
            session = transaction.session;
        }

        return { options, session };
    }

    async select(query: Query<T, TId>, options?: Partial<PaginationOptions>): Promise<Cursor<T>>;
    async select(query: Query<T, TId>, transaction?: Transaction): Promise<Cursor<T>>;
    async select(query: Query<T, TId>, options?: Partial<PaginationOptions> | Transaction, transaction?: Transaction): Promise<Cursor<T>>;
    async select(query: Query<T, TId>, arg2?: Partial<PaginationOptions> | Transaction, arg3?: Transaction): Promise<Cursor<T>> {
        const { options, session } = this.getOptionsAndTransaction(arg2, arg3);
        const mongodbQuery = this.translater.translateFindQuery(query);
        const findOptions = this.translater.translateFindOptions(options, session);
        const connection = await this.connect();
        const cursor = connection.collection.find<T>(mongodbQuery, findOptions);
        const hasNext = await cursor.hasNext();

        return new MongoDbCursor(cursor, hasNext);
    }

    async count(query?: Query<T, TId>, transaction?: Transaction): Promise<number> {
        const cursor = await this.select(query || {}, transaction);
        return await cursor.count(false);
    }

    async update<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session } : {};
        const result = await connection.collection.updateOne(filter, update as any, options);

        return {
            matched: result.matchedCount,
            updated: result.modifiedCount > 0,
        };
    }

    async updateAll<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session } : {};
        const result = await connection.collection.updateMany(filter, update as any, options);

        return {
            matched: result.matchedCount,
            updated: result.modifiedCount > 0,
        };
    }

    async updateOrInsert<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<InsertOrUpdateResult<any>> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session, upsert: true } : { upsert: true };
        const result = await connection.collection.updateOne(filter, update as any, options);

        return {
            matched: result.matchedCount,
            updated: result.modifiedCount > 0,
            insertedId: result.upsertedId?._id,
            inserted: result.upsertedCount > 0
        };
    }

    async updateOrInsertAll<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<InsertOrUpdateResult<any>> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session, upsert: true } : { upsert: true };
        const result = await connection.collection.updateMany(filter, update as any, options);

        return {
            matched: result.matchedCount,
            updated: result.modifiedCount > 0,
            insertedId: result.upsertedId?._id,
            inserted: result.upsertedCount > 0
        };
    }

    async deleteAll<Q extends Query<T, TId>>(query: Q, transaction?: Transaction): Promise<DeleteResult> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session } : {};
        const result = await connection.collection.deleteMany(filter, options);

        return {
            deleted: (result.deletedCount || 0) > 0,
            matched: result.deletedCount || 0
        };
    }

    async replace<Q extends Query<T, TId>>(query: Q, model: T, transaction?: Transaction): Promise<ReplaceResult<TId>> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const filter = this.translater.translateFindQuery(query);
        const connection = await this.connect();
        const options = session ? { session } : {};
        const result = await connection.collection.findOneAndReplace(filter, model, options);

        return {
            replaced: result.ok ? true : false,
            ids: result.value ? [result.value._id] : [],
            matched: result.ok ? 1 : 0
        };
    }

    async drop(transaction?: Transaction): Promise<void> {
        const { session } = this.getOptionsAndTransaction(transaction);
        const connection = await this.connect();

        await connection.collection.drop(session ? { session } : undefined);
    }

    async clear(transaction?: Transaction): Promise<void> {
        await this.deleteAll({ _id: { $exists: true } }, transaction);
    }

    async getById(id: TId): Promise<T | undefined> {
        return await this.find({
            $id: id
        });
    }

    async find<Q extends Query<T, TId>>(query: Q): Promise<T | undefined> {
        const connection = await this.connect();
        const mongodbQuery = this.translater.translateFindQuery(query);
        const result = await connection.collection.findOne<T>(mongodbQuery);

        return result || undefined;
    }

    async findAll(query: Query<T, TId>, options?: Partial<PaginationOptions>): Promise<PaginatedData<T>> {
        options = options || {};
        options.page = options.page || 1;
        options.pageSize = options.pageSize || 50;

        const cursor = await this.select(query, options);
        const data = await cursor.toArray();
        const total = await cursor.count(false);
        const lastPage = Math.ceil(total / options.pageSize);
        await cursor.close();

        return {
            page: options.page,
            pageSize: options.pageSize,
            data,
            lastPage,
            total
        };
    }

    async create(model: IdOptional<T, TId>): Promise<T | undefined> {
        const connection = await this.connect();
        const result = await connection.collection.insertOne(model as any);

        return result.ops[0] as T;
    }

    async createAll(models: IdOptional<T, TId>[]): Promise<T[]> {
        const connection = await this.connect();
        const result = await connection.collection.insertMany(models as any[], { ordered: false });

        return result.ops as T[];
    }

    async patch(id: TId, model: Partial<IdLess<T>>): Promise<T | undefined> {
        const connection = await this.connect();
        const result = await connection.collection.findOneAndUpdate({ _id: id as any }, { $set: model as any }, {
            upsert: false,
            returnOriginal: false
        });

        return result.value;
    }

    async put(model: T): Promise<T | undefined> {
        const connection = await this.connect();
        const doc: IdOptional<T, TId> = Object.assign({}, model);
        if ('_id' in doc) {
            delete doc['_id'];
        }
        const result = await connection.collection.findOneAndUpdate({
            _id: model._id as any
        }, { $set: doc as any }, {
            upsert: true,
            returnOriginal: false
        });

        return result.value;
    }

    async deleteById(id: TId): Promise<DeleteResult> {
        const connection = await this.connect();
        const result = await connection.collection.deleteOne({
            _id: id as any
        });

        return {
            deleted: (result.deletedCount || 0) > 0,
            matched: result.result.n || 0,
        };
    }

    get dbName() {
        return this.databaseName;
    }

    get entityName() {
        return this.collectionName;
    }

    get serviceName() {
        return 'mongodb';
    }

    async getNativeCollection(): Promise<Collection> {
        const conenction = await this.connect();
        return conenction.collection;
    }
}
