/**
 * Storage class for keeping the app configs globally accessible
 * Configs are loaded from the environment file in the directory `config`
 *
 * @export
 * @class ConfigStorage
 */
export class ConfigStorage {
    private static __app: {get: (key: string) => any};

    private constructor() {}

    /**
     * Get a config by name
     *
     * @static
     * @param {string} key
     * @returns {*}
     * @memberof ConfigStorage
     */
    static get(key: string): any {
        return this.__app.get(key);
    }

    /**
     * Register the app for config extracting
     * Used inside the framework
     *
     * @static
     * @param {{get: (key: string) => any}} app
     * @memberof ConfigStorage
     */
    static registerApp(app: {get: (key: string) => any}): void {
        this.__app = app;
    }
}
