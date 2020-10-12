import { ClientSession, FilterQuery, FindOneOptions } from "mongodb";
import { PaginationOptions } from "../../utils";
import { Id, Query, queryComparingKeys, QueryOn, QueryOperator } from "../query";

export class MongoDbTranslater<T, TId extends Id<unknown> = unknown> {
    private translateFindOnQuery<T>(query: QueryOn<T>): FilterQuery<T> {
        const mongodbQuery: any = {};
        for (const key of Object.keys(query.$on) as Array<keyof T>) {
            const value = query.$on[key];
            if (typeof value !== 'string' && !Array.isArray(value) && typeof value === 'object') {
                const operator = value as QueryOperator<T>;
                if ('$isSet' in operator) {
                    mongodbQuery[key] = { $exists: operator.$isSet };
                    continue;
                } else if ('$length' in operator) {
                    mongodbQuery[key] = { $size: operator.$length };
                    continue;
                } else if ('$neq' in operator) {
                    mongodbQuery[key] = { $ne: operator.$neq };
                    continue;
                }
                for (const operatorKey of queryComparingKeys) {
                    if (operatorKey in operator) {
                        mongodbQuery[key] = {};
                        mongodbQuery[key][operatorKey] = (operator as any)[operatorKey];
                    }
                }
                continue;
            }
            mongodbQuery[key] = value;
        }
        return mongodbQuery;
    }

    translateFindQuery(query: Query<T, TId>): FilterQuery<T> {
        const mongodbQuery: any = {};
        if ('$and' in query) {
            mongodbQuery.$and = query.$and.map(q => this.translateFindQuery(q));
        } else if ('$or' in query) {
            mongodbQuery.$or = query.$or.map(q => this.translateFindQuery(q));
        } else if ('$on' in query) {
            return this.translateFindOnQuery(query);
        } else if ('$id' in query) {
            mongodbQuery._id = query.$id;
        }

        return mongodbQuery;
    }

    translateFindOptions(options?: Partial<PaginationOptions>, session?: ClientSession) {
        options = options || {};

        const findOneOptions: FindOneOptions<any> = {};
        if (options.pageSize !== undefined) {
            findOneOptions.limit = options.pageSize;
        }
        if (options.page !== undefined && findOneOptions.limit !== undefined) {
            findOneOptions.skip = findOneOptions.limit * (options.page - 1);
        }
        if (options.sortBy !== undefined) {
            findOneOptions.sort = {};
            findOneOptions.sort[options.sortBy] = options.sortType;
        }
        if (session) {
            findOneOptions.session = session;
        }
        return findOneOptions;
    }
}
