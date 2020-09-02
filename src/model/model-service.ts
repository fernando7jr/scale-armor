import { Id, Query } from './query';

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
    replaced: number;
    matched: number;
}

export interface Cursor<T> {
    readonly isOpen: boolean;
    readonly totalFetched: number;
    readonly canFetchMore: boolean;

    fetch(size: number): Promise<T[]>;
    close(): Promise<{}>;
}

export interface ModelService<T, TId extends Id<unknown> = unknown> {
    openCursorFor<Q extends Query<T>>(query: Q): Cursor<T>;

    getById(id: TId): Promise<T>;
    find<Q extends Query<T>>(query: Q): Promise<T>;
    findAll(query: Query<T>): Promise<T[]>;

    create(model: T): Promise<InsertResult<TId>>;
    createAll(models: T[]): Promise<InsertResult<TId>>;
    patch(id: TId, model: Partial<T>): Promise<UpdateResult>;
    put(model: T): Promise<InsertOrUpdateResult<TId>>;
    deleteById(id: TId): Promise<DeleteResult>;

    update<Q extends Query<T>>(query: Q): Promise<UpdateResult>;
    updateAll<Q extends Query<T>>(query: Q): Promise<UpdateResult>;
    deleteAll<Q extends Query<T>>(query: Q): Promise<DeleteResult>;
    replaceAll<Q extends Query<T>>(query: Q): Promise<ReplaceResult<TId>>;
}
