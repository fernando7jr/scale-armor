import { Injectable, ClassConstructor, InjectableRequirer } from "./injectable";
import { ModuleDoesNotHaveInjectable } from "./error";

export class Module implements InjectableRequirer {
    private repository = new Map<string, Injectable<any>>();

    inject<T>(injectable: Injectable<T>): void {
        this.repository.set(injectable.name, injectable);
    }

    tryRequire<T>(name: string): T | undefined;
    tryRequire<T>(classConstructor: ClassConstructor): T | undefined;
    tryRequire<T>(arg: string | (Object & { name: string; }) | (Function & { name: string; })): T | undefined {
        if (typeof arg !== 'string') {
            return this.require(arg.name);
        }

        const injectable = this.repository.get(name);
        if (!injectable) {
            return undefined;
        }

        let value = injectable.value;
        if (!value) {
            value = injectable.factory(this);
            injectable.value = value;
        }

        return value as T;
    }

    require<T>(name: string): T;
    require<T>(classConstructor: ClassConstructor): T;
    require<T>(arg: any): T {
        const injectable = this.tryRequire<T>(arg);
        if (!injectable) {
            throw new ModuleDoesNotHaveInjectable('name' in arg ? arg.name : arg);
        }

        return injectable;
    }
}
