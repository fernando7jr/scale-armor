import { expect } from 'chai';
import { ProvidedFor } from './provided-for';
import { App } from './app';


describe(ProvidedFor.name, () => {
    it('should inject an app for the object', async () => {
        const test = { a: 1 };
        ProvidedFor.defineAppProviderName('test', test);
        const metadata = ProvidedFor.getAppMetadata(test);
        expect(metadata).to.not.be.undefined;
        expect(metadata?.name).to.not.be.undefined;
        expect(metadata?.appProvider).to.not.be.undefined;
        expect(metadata?.appProvider.build(metadata?.name as any)).to.be.instanceOf(App);
    });

    it('should inject an app for the class', async () => {
        @ProvidedFor('test')
        class Test {

        }
        const metadata = ProvidedFor.getAppMetadata(Test);
        expect(metadata).to.not.be.undefined;
        expect(metadata?.name).to.not.be.undefined;
        expect(metadata?.appProvider).to.not.be.undefined;
        expect(metadata?.appProvider.build(metadata?.name as any)).to.be.instanceOf(App);
    });
});
