export type DisallowedKeys<T> = { [k in keyof T]?: void };
export type Id<T> = T extends undefined ? never : T;
export interface QueryKeywords {
    $eq: any;
    $neq: any;
    $lt: any;
    $lte: any;
    $gt: any;
    $gte: any;
    $in: any;
    $nin: any;
    $isSet: any;
    $on: any;
    $or: any;
    $and: any;
    $matchRegex: any;
    $length: any;

    $set: any;
    $unset: any;
    $push: any;
    $pop: any;
    $index: any;
}

export const queryComparingKeys = [
    '$eq',
    '$neq',
    '$lt',
    '$lte',
    '$gt',
    '$gte',
    '$in',
    '$nin',
    '$isSet',
    '$on',
    '$or',
    '$and',
    '$matchRegex',
] as const;

export type NoQueryKeywords<T> = T extends DisallowedKeys<QueryKeywords> ? never : T;
export type QueryOperator<T = any> = { $eq: T; } | { $neq: T; }
    | { $lt: T; } | { $lte: T; } | { $gt: T; } | { $gte: T; }
    | { $in: T[]; } | { $nin: T[]; } | { $isSet: boolean; }
    | { $matchRegex: RegExp | string; } | { $length: number; };
export type QueryById<TId> = { $id: TId; };
export type QueryOn<T> = { $on: Partial<{ [K in keyof T]: T[keyof T] | QueryOperator<T[keyof T]>; }>; };
type _Query<T, TId extends Id<any>> = QueryOn<NoQueryKeywords<T>> | QueryById<TId>;
export type QueryOr<T, TId> = { $or: _Query<T, TId>[]; };
export type QueryAnd<T, TId> = { $and: _Query<T, TId>[]; };
export type Query<T, TId extends Id<any>> = QueryOn<NoQueryKeywords<T>> | QueryById<TId> | QueryOr<T, TId> | QueryAnd<T, TId> | {};

export type UpdateQuery<T> = Partial<{
    $set: Partial<{ [K in keyof T]: T[keyof T] }>;
    $unset: Partial<{ [K in keyof T]: boolean }>;
    $addToSet: Partial<{ [K in keyof T]: T[keyof T] }>;
    $push: Partial<{ [K in keyof T]: T[keyof T] }>;
    $pop: Partial<{ [K in keyof T]: number | { $index: number; } }>;
}>;

