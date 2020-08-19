import { ClassConstructor } from "../utils/class";

export { ClassConstructor } from "../utils/class";

export interface InjectableRequirer {
    tryRequire<T>(name: string): T | undefined;
    tryRequire<T>(classConstructor: ClassConstructor): T | undefined;

    require<T>(name: string): T;
    require<T>(classConstructor: ClassConstructor): T;
}

export interface Injectable<T> {
    readonly name: string;
    readonly typeName: string;
    value: T;
    factory(module: InjectableRequirer): T;
}
