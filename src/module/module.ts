import { Injectable, ClassType, InjectableRequirer } from "./injectable";
import { ModuleDoesNotHaveInjectable, ModuleAlreadyHasInjectable } from "./error";

export class Module implements InjectableRequirer {
    private repository = new Map<string, Injectable<any>>();

    private resolveInjectableName(arg: string | ClassType): string {
        if (typeof arg !== 'string') {
            return arg.name;
        }
        return arg;
    }

    contains(name: string): boolean;
    contains(classType: ClassType): boolean;
    contains(arg: string | ClassType): boolean {
        const name = this.resolveInjectableName(arg);
        return this.repository.has(name);
    }

    inject<T>(injectable: Injectable<T>): void {
        const name = injectable.name;
        if (this.contains(name)) {
            throw new ModuleAlreadyHasInjectable(name);
        }
        this.repository.set(name, injectable);
    }

    tryRequire<T>(name: string): T | undefined;
    tryRequire<T>(classType: ClassType): T | undefined;
    tryRequire<T>(arg: string | ClassType): T | undefined {
        const name = this.resolveInjectableName(arg);

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
    require<T>(classType: ClassType): T;
    require<T>(arg: string | ClassType): T {
        const name = this.resolveInjectableName(arg);
        const injectable = this.tryRequire<T>(name);

        if (!injectable) {
            throw new ModuleDoesNotHaveInjectable(name);
        }

        return injectable;
    }
}
