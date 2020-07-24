import { ResponseBuilder, Response, Headers } from '../app/request';
import { StatusCode } from '../app/status';

export abstract class ResponseBuilderBase implements ResponseBuilder {
    private _status: StatusCode;
    private _contentType?: string;
    private _headers: Headers;

    constructor(status: StatusCode, headers?: Headers, contentType?: string) {
        this._status = status;
        this._headers = headers || {};
        this._contentType = contentType;
    }

    protected abstract writeBody(): string | Buffer;
    
    get status(): StatusCode {
        return this._status; 
    }

    get contentType(): string | undefined {
        return this._contentType;
    }

    get headers(): Headers {
        return this._headers;
    }
    
    build(): Response {
        return {
            contentType: this.contentType,
            status: this.status,
            headers: this.headers,
            body: this.writeBody()
        };
    }
}
