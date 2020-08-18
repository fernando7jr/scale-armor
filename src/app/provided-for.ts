import 'reflect-metadata';
import { SimpleAppProvider } from './simple-app';
import { AppProvider } from './app';

interface AppMetadata {
    name?: string;
    appProvider: AppProvider;
}
const metadataSymbol = Symbol('design:scar:');

export type ClassConstructor = Function | Object;


export function ProvidedFor(name: string): ClassDecorator {
    return (target: ClassConstructor) => {
        ProvidedFor.defineAppProviderName(name, target);
    };
};

ProvidedFor.getAppMetadata = function (target: ClassConstructor): AppMetadata {
    let metadata: AppMetadata = Reflect.getMetadata(metadataSymbol, target);
    if (!metadata) {
        metadata = {
            appProvider: new SimpleAppProvider()
        };
        Reflect.defineMetadata(metadataSymbol, metadata, target);
    }

    return metadata;
};

ProvidedFor.defineAppProviderName = function (name: string, target: ClassConstructor): void {
    const metadata = ProvidedFor.getAppMetadata(target);
    metadata.name = name;
};
