import 'reflect-metadata';
import { SimpleAppProvider } from './simple-app';
import { AppProvider } from './app';

export type ClassConstructor = Function | Object;

export function ProvideApp(name: string): ClassDecorator {
    return (target: ClassConstructor) => {
        ProvideApp.defineAppProvider(name, target);
    };
};

ProvideApp.defineAppProvider = function (name: string, target: ClassConstructor): void {
    Reflect.defineMetadata('appProviver', new SimpleAppProvider(name), target);
};

ProvideApp.getAppProvider = function (target: ClassConstructor): AppProvider | undefined {
    return Reflect.getMetadata('appProviver', target);
};
