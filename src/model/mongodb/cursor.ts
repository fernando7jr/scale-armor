import { Cursor as __Cursor } from 'mongodb';
import { Cursor } from '../model-service';

export class MongoDbCursor<T> implements Cursor<T> {
    private __alreadyFetched = 0;
    private __cursor: __Cursor<T>;
    private __hasNext;

    constructor(cursor: __Cursor<T>, hasNext: boolean) {
        this.__cursor = cursor;
        this.__hasNext = hasNext;
    }

    get isOpen(): boolean {
        return !this.__cursor.isClosed;
    }

    get totalFetched(): number {
        return this.__alreadyFetched;
    }

    get canFetchMore(): boolean {
        return this.__hasNext;
    }

    async fetch(size: number): Promise<T[]> {
        const data: T[] = [];
        for (let i = 0; i < size; i += 1) {
            const value = await this.__cursor.next();
            if (value === null) {
                this.__hasNext = false;
                break;
            }
            data.push(value);
        }
        this.__alreadyFetched += data.length;
        return data;
    }

    async count(applyPagingOptions?: boolean): Promise<number> {
        return await this.__cursor.count(applyPagingOptions);
    }

    async close(): Promise<void> {
        await this.__cursor.close();
    }

    async toArray(): Promise<T[]> {
        const data = await this.__cursor.toArray();
        this.__alreadyFetched += data.length;
        return data;
    }
}