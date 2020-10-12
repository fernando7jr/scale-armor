import { ResponseBuilder, Headers, Response } from "./request";
import { StatusCode } from "./status";

/**
 * The base implementation of a ResponseBuilder
 * Can be used directly for more control of how the response should be built.
 * @class
 */
export class CommonResponseBuilder implements ResponseBuilder {
    protected _headers: Headers;
    protected _contentType: string;
    protected _body: any;
    protected _status: StatusCode;

    /**
     * @constructor
     * @param response.headers default {} - the readers dict for the response
     * @param response.contentType default 'text/html' - the content-type for the response
     * @param response.body - the body for the response
     * @param response.status the status code for the response
     */
    constructor(response: {
        headers?: Headers,
        contentType?: string,
        body?: any,
        status: StatusCode;
    }) {
        this._headers = response.headers || {};
        this._contentType = response.contentType || 'text/html';
        this._body = response.body;
        this._status = response.status;
    }

    /** 
     * Get the content-type 
     * @readonly
     * @type {string}
     */
    get contentType(): string {
        return this._contentType;
    }

    /** 
     * Get the headers dict 
     * @readonly
     * @type {Headers}
     */
    get headers(): Headers {
        return this._headers;
    }

    /** 
     * Get the status code
     * @readonly
     * @type {StatusCode}
     */
    get status(): StatusCode {
        return this._status;
    }

    /** 
     * Get the body 
     * @readonly
     */
    protected get body(): any {
        return this._body;
    }

    /**
     * Build the Response object
     * @returns {Response} the response
     */
    build(): Response {
        const body = this.body;
        return {
            contentType: this.contentType,
            headers: this.headers,
            status: this.status,
            body: this.body
        };
    }
}

/**
 * 'text/plain' specialized ResponseBuilder.
 * All built responses will contain the mime-type set to 'text/plain'
 * @class
 * @extends TextResponseBuilder
 */
export class TextResponseBuilder extends CommonResponseBuilder {
    /**
     * @constructor
     * @param response.body - the body for the response
     * @param response.status the status code for the response
     * @param response.headers default {} - the readers dict for the response
     */
    constructor(body: string | undefined, status: StatusCode, headers?: Headers) {
        super({
            contentType: 'text/plain',
            body,
            status,
            headers,
        });
    }

    /** 
     * Get the body. Defaults to '' when not set
     * @readonly
     */
    protected get body(): any {
        return super.body || '';
    }
}

/**
 * A ResponseBuilder dedicated to responses based on the status code
 * @class
 * @extends TextResponseBuilder
 */
export class StatusResponseBuilder extends TextResponseBuilder {
    /**
     * @constructor
     * @param status - The status code
     * @param message - An optional message to be used in the body
     */
    constructor(status: StatusCode, message?: string) {
        super(message, status);
    }

    /** 
     * Get the body
     * @readonly
     */
    protected get body(): any {
        const body = super.body;
        const status = this.status;
        if (!body) {
            return `${status.code} - ${status.name}`;
        }
        return `${status.code} - ${status.name}: ${body}`;
    }
}

/**
 * JSON specialized ResponseBuilder
 * Every response built will contain a valid json string for the body
 * @class
 * @extends CommonResponseBuilder
 */
export class JSONResponseBuilder extends CommonResponseBuilder {
    /**
     * @constructor
     * @param body - any json serializable value for the body
     * @param status - the status code for the response
     * @param headers default {} - the readers dict for the response
     */
    constructor(body: any, status: StatusCode, headers?: Headers) {
        super({
            headers,
            body,
            status,
            contentType: 'application/json'
        });
    }

    /** 
     * Get the serialized body 
     * @readonly
     * @type {string}
     */
    protected get body(): string {
        return JSON.stringify(super.body);
    }
}

/**
 * A JSON version of StatusResponseBuilder dedicated to responses based on the status code
 * @class
 * @extends JSONResponseBuilder
 */
export class JSONStatusResponseBuilder extends JSONResponseBuilder {
    /**
     * @constructor
     * @param status - the status code for the response
     * @param content - an optional string message
     */
    constructor(status: StatusCode, content?: string) {
        super({
            status: status.code,
            reason: status.name,
            message: content
        }, status);
    }
}
