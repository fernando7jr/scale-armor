import { expect } from 'chai';
import { ClassType, ClassConstructor } from '../utils';
import { Injectable, makeInjectable } from './injectable';

describe('Injectable', () => {
    class Test1 {
        foo: number;

        constructor(foo?: number) {
            this.foo = foo || 2;
        }
    }

    it('should make it injectable', () => {
        const _injectMe = Test1;
        let injectable: Injectable<any> = undefined as any;

        expect(() => {
            injectable = makeInjectable(_injectMe);
        }).to.not.throw(Error);
        expect(injectable).to.not.be.undefined;
        expect(injectable.value).to.be.undefined;
        expect(injectable.name).to.equals(_injectMe.name);
        expect(injectable.typeName).to.equals(_injectMe.name);
        expect(injectable.factory({} as any)).to.be.instanceOf(_injectMe);
    });

    it('should fail when injecting without a name', () => {
        const _injectMe = {} as any;
        let injectable: Injectable<any> = undefined as any;

        expect(() => {
            injectable = makeInjectable(_injectMe);
        }).to.throw(Error);
    });

    it('should make it injectable with a custom name', () => {
        const _injectMe = Test1;
        let injectable: Injectable<any> = undefined as any;

        expect(() => {
            injectable = makeInjectable(_injectMe, { name: 'customNameTest2' });
        }).to.not.throw(Error);
        expect(injectable).to.not.be.undefined;
        expect(injectable.value).to.be.undefined;
        expect(injectable.name).to.equals('customNameTest2');
        expect(injectable.typeName).to.equals(_injectMe.name);
        expect(injectable.factory({} as any)).to.be.instanceOf(_injectMe);
    });

    it('should make it injectable with a pre-defined value', () => {
        const _injectMe = Test1;
        let injectable: Injectable<any> = undefined as any;
        const use = new Test1();
        use.foo = 4;

        expect(() => {
            injectable = makeInjectable(_injectMe, { use });
        }).to.not.throw(Error);
        expect(injectable).to.not.be.undefined;
        expect(injectable.value).to.be.deep.equal(use);
        expect(injectable.name).to.equals(_injectMe.name);
        expect(injectable.typeName).to.equals(_injectMe.name);
        expect(injectable.factory({} as any)).to.be.instanceOf(_injectMe);
        expect(injectable.factory({} as any)).to.be.deep.equal(use);
    });

    it('should make it injectable with a custom factory', () => {
        const _injectMe = Test1;
        let injectable: Injectable<any> = undefined as any;

        expect(() => {
            injectable = makeInjectable(_injectMe, { factory: () => new Test1(5) });
        }).to.not.throw(Error);
        expect(injectable).to.not.be.undefined;
        expect(injectable.value).to.be.undefined;
        expect(injectable.name).to.equals(_injectMe.name);
        expect(injectable.typeName).to.equals(_injectMe.name);
        expect(injectable.factory({} as any)).to.be.instanceOf(_injectMe);
        expect(injectable.factory({} as any).foo).to.equals(5);
    });
});
