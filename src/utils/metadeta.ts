import 'reflect-metadata';


export class Metadeta {
    private constructor() { }

    static getMetadata<T = unknown>(target: Object | Function, symbol: symbol): T {
        return Reflect.getMetadata(symbol, target);
    }

    static setMetadata<T>(target: Object | Function, symbol: symbol, metadata: T): T {
        Reflect.defineMetadata(symbol, metadata, target);
        return metadata;
    }

    static ensureMetadata<T = unknown>(target: Object | Function, symbol: symbol, metadata: T): T {
        const _metadata = this.getMetadata<T>(target, symbol);
        if (_metadata) {
            return _metadata;
        }
        this.setMetadata(target, symbol, metadata);
        return metadata;
    }
}