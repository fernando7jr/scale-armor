export class ConfigStorage {
    private static __app: {get: (key: string) => any};

    static get(key: string): any {
        return this.__app.get(key);
    }

    static registerApp(app: {get: (key: string) => any}): void {
        this.__app = app;
    }
}
