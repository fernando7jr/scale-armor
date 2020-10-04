import { Id, Query, UpdateQuery } from './query';
import { PagedData, PagingOptions } from '../utils';

export interface Model<TId extends Id<unknown> = unknown> {
    _id: TId;
}
export type IdOptional<T extends Model<TId>, TId extends Id<unknown> = unknown> = { _id?: T["_id"]; } & Omit<T, "_id">;
export type IdLess<T> = Omit<T, "_id">;

export interface InsertResult<TId extends Id<unknown> = unknown> {
    ids: TId[];
    inserted: number;
    conflict: number;
}
export interface UpdateResult {
    updated: boolean;
    matched: number;
}
export interface InsertOrUpdateResult<TId extends Id<unknown> = unknown> extends
    InsertResult<TId>, UpdateResult {
}
export interface DeleteResult {
    deleted: boolean;
    matched: number;
}
export interface ReplaceResult<TId extends Id<unknown> = unknown> {
    ids: TId[];
    replaced: boolean;
    matched: number;
}

export interface Cursor<T> {
    readonly isOpen: boolean;
    readonly totalFetched: number;
    readonly canFetchMore: boolean;

    fetch(size: number): Promise<T[]>;
    count(applyPagingOptions?: boolean): Promise<number>;
    close(): Promise<void>;
    toArray(): Promise<T[]>;
}
export abstract class Transaction {
    abstract async commit(): Promise<void>;
    abstract async rollback(): Promise<void>;
}

export interface ModelService<T extends Model<TId>, TId extends Id<unknown> = unknown> {
    readonly entityName: string;
    readonly dbName: string;
    readonly serviceName: string;

    withTransaction(callback: (transaction: Transaction) => Promise<void>): void;
    select(query: Query<T, TId>, transaction?: Transaction): Promise<Cursor<T>>;
    select(query: Query<T, TId>, options?: Partial<PagingOptions>, transaction?: Transaction): Promise<Cursor<T>>;
    update<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult>;
    updateAll<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult>;
    updateOrInsert<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult>;
    updateOrInsertAll<Q extends Query<T, TId>, U extends UpdateQuery<T>>(query: Q, update: U, transaction?: Transaction): Promise<UpdateResult>;
    deleteAll<Q extends Query<T, TId>>(query: Q, transaction?: Transaction): Promise<DeleteResult>;
    replace<Q extends Query<T, TId>>(query: Q, model: T, transaction?: Transaction): Promise<ReplaceResult<TId>>;

    drop(transaction?: Transaction): Promise<void>;
    clear(transaction?: Transaction): Promise<void>;

    getById(id: TId): Promise<T | undefined>;
    find<Q extends Query<T, TId>>(query: Q): Promise<T | undefined>;
    findAll(query: Query<T, TId>, options?: Partial<PagingOptions>): Promise<PagedData<T>>;

    create(model: IdOptional<T, TId>): Promise<T | undefined>;
    createAll(models: IdOptional<T, TId>[]): Promise<T[]>;
    patch(id: TId, model: IdLess<T>): Promise<T | undefined>;
    put(model: T): Promise<T | undefined>;
    deleteById(id: TId): Promise<DeleteResult>;
}
