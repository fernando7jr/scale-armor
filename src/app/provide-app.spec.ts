import { expect } from 'chai';
import { ProvideApp } from './provide-app';
import { App } from './app';


describe(ProvideApp.name, () => {
    it('should inject an app for the object', async () => {
        const test = { a: 1 };
        ProvideApp.defineAppProvider('test', test);
        const appProvider = ProvideApp.getAppProvider(test);
        expect(appProvider).to.not.be.undefined;
        expect(appProvider?.app).to.be.instanceOf(App);
    });

    it('should inject an app for the class', async () => {
        @ProvideApp('test')
        class Test {

        }
        const appProvider = ProvideApp.getAppProvider(Test);
        expect(appProvider).to.not.be.undefined;
        expect(appProvider?.app).to.be.instanceOf(App);
    });
});
