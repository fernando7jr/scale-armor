import { StatusCode } from "./status";

export class TraceableError extends Error {
    private _name: string;
    private _cause: Error | any;

    constructor(name: string, what: string, cause?: Error | any) {
        super(what);
        this._name = name;
        this._cause = cause;
    }

    get name() {
        return this._name;
    }

    get cause() {
        return this._cause;
    }

    get causeError(): Error | undefined {
        if (!this._cause) {
            return undefined;
        } else if (this._cause instanceof Error) {
            return this._cause;
        }

        let error;
        if (this._cause && this._cause.toString instanceof Function) {
            error = new Error(this._cause.toString());
        } else {
            error = new Error(this._cause + '');
        }

        error.stack = undefined;
        return error;
    }

    toString() {
        const cause = this.causeError;

        if (!cause) {
            return this.stack || `${this.name}: ${this.message}`;
        }
        const stack = cause.stack || `${cause.name}: ${cause.message}`;
        return `${this.name}: ${this.message}\n\tCaused by ${stack}`;
    }
}

export class RequestHandlingError extends TraceableError {
    private _status: StatusCode;

    constructor(status: StatusCode, what: string, cause?: Error | any) {
        super(status.name, what, cause);
        this._status = status;
    }

    get status(): StatusCode {
        return this._status;
    }
}
