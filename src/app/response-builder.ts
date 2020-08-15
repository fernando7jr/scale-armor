import { ResponseBuilder, Headers, Response } from "./request";
import { StatusCode } from "./status";

export class CommonResponseBuilder implements ResponseBuilder {
    protected _headers: Headers;
    protected _contentType: string;
    protected _body: any;
    protected _status: StatusCode;

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

    get contentType(): string {
        return this._contentType;
    }

    get headers(): Headers {
        return this._headers;
    }

    get status(): StatusCode {
        return this._status;
    }

    protected get body(): any {
        return this._body;
    }

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

export class TextResponseBuilder extends CommonResponseBuilder {
    constructor(body: string | undefined, status: StatusCode, headers?: Headers) {
        super({
            contentType: 'text/plain',
            body,
            status,
            headers,
        });
    }

    protected get body(): any {
        return super.body || '';
    }
}

export class StatusResponseBuilder extends TextResponseBuilder {
    constructor(status: StatusCode, message?: string) {
        super(message, status);
    }

    protected get body(): any {
        const body = super.body;
        const status = this.status;
        if (!body) {
            return `${status.code} - ${status.name}`;
        }
        return `${status.code} - ${status.name}: ${body}`;
    }
}

export class JSONResponseBuilder extends CommonResponseBuilder {
    constructor(body: any, status: StatusCode, headers?: Headers) {
        super({
            headers,
            body,
            status,
            contentType: 'application/json'
        });
    }

    protected get body(): any {
        return JSON.stringify(super.body);
    }
}

export class JSONStatusResponseBuilder extends JSONResponseBuilder {
    constructor(status: StatusCode, content?: string) {
        super({
            status: status.code,
            reason: status.name,
            message: content
        }, status);
    }
}
