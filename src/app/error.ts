import { StatusCode } from "./status";

/**
 * An exception class to trace back of errors to their cause
 * @class
 */
export class TraceableError extends Error {
    private _name: string;
    private _cause: Error | any;

    /**
     * @constructor
     * @param name - The name of the error
     * @param what - The description of the error
     * @param cause - The true cause of the error. It can be an Error or anything
     */
    constructor(name: string, what: string, cause?: Error | any) {
        super(what);
        this._name = name;
        this._cause = cause;
    }

    /**
     * Get the name of the error
     */
    get name() {
        return this._name;
    }

    /**
     * Get the cause of the error
     */
    get cause() {
        return this._cause;
    }

    /**
     * Get the cause of the error but always return an error object or undefined
     * Very similar to @this.cause
     */
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

    /**
     * Returns a fully detailed description of the error with the stack trace
     */
    toString() {
        const cause = this.causeError;

        if (!cause) {
            return this.stack || `${this.name}: ${this.message}`;
        }
        const stack = cause.stack || `${cause.name}: ${cause.message}`;
        return `${this.name}: ${this.message}\n\tCaused by ${stack}`;
    }
}

/**
 * An exception class to any exception which should be handled as an Response
 * @class
 */
export class RequestHandlingError extends TraceableError {
    private _status: StatusCode;

    /**
     * @constructor
     * @param status - The status code to be used in the response
     * @param what - The description of the error
     * @param cause - The true cause of the error. It can be an Error or anything
     */
    constructor(status: StatusCode, what: string, cause?: Error | any) {
        super(status.name, what, cause);
        this._status = status;
    }

    /**
     * Get the status code for this error
     */
    get status(): StatusCode {
        return this._status;
    }
}
