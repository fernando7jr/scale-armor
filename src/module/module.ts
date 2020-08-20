import { Injectable, ClassType, InjectableRequirer } from "./injectable";
import { ModuleDoesNotHaveInjectable, ModuleAlreadyHasInjectable } from "./error";

export class Module implements InjectableRequirer {
    private subModules: Module[] = [];
    private repository = new Map<string, Injectable<any>>();

    private resolveInjectableName(arg: string | ClassType): string {
        if (typeof arg !== 'string') {
            return arg.name;
        }
        return arg;
    }

    private findInSubModules<T>(name: string): T | undefined {
        for (const subModule of this.subModules) {
            const value = subModule.tryRequire<T>(name);
            if (value) {
                return value;
            }
        }
        return undefined;
    }

    import(subModule: Module): this {
        this.subModules.push(subModule);
        return this;
    }

    contains(name: string): boolean;
    contains(classType: ClassType): boolean;
    contains(arg: string | ClassType): boolean {
        const name = this.resolveInjectableName(arg);
        return this.repository.has(name);
    }

    inject<T>(injectable: Injectable<T>): this {
        const name = injectable.name;
        if (this.contains(name)) {
            throw new ModuleAlreadyHasInjectable(name);
        }
        this.repository.set(name, injectable);
        return this;
    }

    tryRequire<T>(name: string): T | undefined;
    tryRequire<T>(classType: ClassType): T | undefined;
    tryRequire<T>(arg: string | ClassType): T | undefined {
        const name = this.resolveInjectableName(arg);

        const injectable = this.repository.get(name);
        if (!injectable) {
            return this.findInSubModules(name);
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
