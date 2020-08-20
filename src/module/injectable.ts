import { ClassType, ClassConstructor } from "../utils/class";

export { ClassType, ClassConstructor } from "../utils/class";

export interface InjectableRequirer {
    contains(name: string): boolean;
    contains(classType: ClassType): boolean;

    tryRequire<T>(name: string): T | undefined;
    tryRequire<T>(classType: ClassType): T | undefined;

    require<T>(name: string): T;
    require<T>(classType: ClassType): T;
}

export interface Injectable<T> {
    readonly name: string;
    readonly typeName: string;
    value?: T;
    factory(requirer: InjectableRequirer): T;
}

export type InjectableFactory<T> = (requirer: InjectableRequirer) => T;
export type InjectableOptions<T> = { readonly name?: string; } & (
    { factory?: InjectableFactory<T>; } | { readonly use: T; }
);

export function makeInjectable<T>(classConstructor: ClassConstructor<T>, options?: InjectableOptions<T>): Injectable<T>;
export function makeInjectable<T>(classType: ClassType, options?: InjectableOptions<T> & { name: string; }): Injectable<T>;
export function makeInjectable<T>(arg: any, options?: InjectableOptions<T>): Injectable<T> {
    let name: string;
    let factory: InjectableFactory<T>;
    let value: T | undefined = undefined;
    options = options || {};

    if (!options.name) {
        name = arg.name;
    } else {
        name = options.name;
    }

    if (!name) {
        throw new Error('A name is required for making the injectable');
    }

    if ('factory' in options && options.factory) {
        factory = options.factory;
    } else if ('use' in options && options.use) {
        value = options.use;
        factory = () => value as T;
    } else {
        factory = () => Reflect.construct(arg, []);
    }

    return {
        name,
        typeName: arg.name || '',
        factory,
        value
    };
}
