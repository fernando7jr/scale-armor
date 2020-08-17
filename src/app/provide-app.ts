import 'reflect-metadata';
import { SimpleAppProvider } from './simple-app';
import { AppProvider } from './app';

export function ProvideApp(name: string): ClassDecorator {
    return (target: Object) => {
        ProvideApp.defineAppProvider(name, target);
    };
};

ProvideApp.defineAppProvider = function (name: string, target: Object,): void {
    Reflect.defineMetadata('appProviver', new SimpleAppProvider(name), target);
};

ProvideApp.getAppProvider = function (target: Object): AppProvider | undefined {
    return Reflect.getMetadata('appProviver', target);
};
