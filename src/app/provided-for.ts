import { Metadeta } from '../utils/metadeta';
import { ClassConstructor } from '../utils/class';
import { SimpleAppProvider } from './simple-app';
import { AppProvider } from './app';

interface AppMetadata {
    name?: string;
    appProvider: AppProvider;
}
const metadataSymbol = Symbol('design:scar:');


export function ProvidedFor(name: string): ClassDecorator {
    return (target: ClassConstructor) => {
        ProvidedFor.defineAppProviderName(name, target);
    };
};

ProvidedFor.getAppMetadata = function (target: ClassConstructor): AppMetadata {
    let metadata: AppMetadata = Metadeta.getMetadata(target, metadataSymbol);
    if (!metadata) {
        metadata = {
            appProvider: new SimpleAppProvider()
        };
        Metadeta.setMetadata(target, metadataSymbol, metadata);
    }

    return metadata;
};

ProvidedFor.defineAppProviderName = function (name: string, target: ClassConstructor): void {
    const metadata = ProvidedFor.getAppMetadata(target);
    metadata.name = name;
};
