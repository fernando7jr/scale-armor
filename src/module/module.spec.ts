import { expect } from 'chai';
import { Module } from './module';
import { ClassType } from '../utils';
import { Injectable } from './injectable';
import { ModuleDoesNotHaveInjectable, ModuleAlreadyHasInjectable } from './error';

describe(Module.name, () => {
    let module: Module;

    const makeInjectable = (classType: ClassType) => {
        const injectable: Injectable<any> = {
            name: classType.name,
            typeName: classType.name,
            factory: () => {
                return Reflect.construct(classType as Function, []);
            }
        };
        return injectable;
    };

    beforeEach(() => {
        module = new Module();
    });

    it('should inject an injectable', () => {
        function test1() {

        }

        module.inject(makeInjectable(test1));
        expect(module.contains(test1)).to.be.true;
    });

    it('should fail when injecting the same injectable more than once', () => {
        function test1() {

        }

        module.inject(makeInjectable(test1));

        expect(() => {
            module.inject(makeInjectable(test1));
        }).to.throw(ModuleAlreadyHasInjectable);
    });

    it('should require an injectable', () => {
        function test1() {

        }

        module.inject(makeInjectable(test1));
        expect(module.require(test1)).to.be.instanceOf(test1);
    });

    it('should fail when require an non-injected injectable', () => {
        function test1() {

        }

        expect(() => {
            return module.require(test1);
        }).to.throw(ModuleDoesNotHaveInjectable);
    });

    it('should try to require an injectable', () => {
        function test1() {

        }

        module.inject(makeInjectable(test1));
        expect(module.tryRequire(test1)).to.be.instanceOf(test1);
    });

    it('should not thrown an exception if try to require fails', () => {
        function test1() {

        }

        expect(module.tryRequire(test1)).to.be.undefined;
    });
});
