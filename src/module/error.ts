export class ModuleDoesNotHaveInjectable extends Error {
    private _name: string;

    constructor(name: string) {
        super(`No injectable for ${name}`);
        this._name = name;
    }

    get name() {
        return this._name;
    }
}
