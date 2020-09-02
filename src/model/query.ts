export type Id<T> = T extends undefined ? never : T;
export type QueryOperator<T = any> = { $eq: T; } | { $neq: T; }
    | { $lt: T; } | { $lte: T; } | { $gt: T; } | { $gte: T; }
    | { $in: T[]; } | { $nin: T[]; } | { $exists: boolean; };
export type Query<T> = { $or: Query<T>[]; } | Partial<{ [K in keyof T]: T[keyof T] | QueryOperator<T[keyof T]>; }>;
