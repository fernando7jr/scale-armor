export interface StatusCode {
    readonly code: number;
    readonly  name: string;
}

export class StatusCodes {
    private constructor() {}

    // Extracted from: https://restfulapi.net/http-status-codes/

    // 2xx: Success
    static readonly Ok: StatusCode = { code: 200, name: 'Ok' } as const;
    static readonly Created: StatusCode = { code: 201, name: 'Created' } as const;
    static readonly Accepted: StatusCode = { code: 202, name: 'Accepted' } as const;
    static readonly NoContent: StatusCode = { code: 204, name: 'No Content' } as const;

    // 3xx: Redirection
    static readonly MovedPermanently: StatusCode = { code: 301, name: 'Moved Permanently' } as const;
    static readonly Found: StatusCode = { code: 302, name: 'Found' } as const;
    static readonly SeeOther: StatusCode = { code: 303, name: 'See Other' } as const;
    static readonly NotModified: StatusCode = { code: 304, name: 'Not Modified' } as const;
    static readonly TemporaryRedirect: StatusCode = { code: 307, name: 'Temporary Redirect' } as const;

    // 4xx: Client Error
    static readonly BadRequest: StatusCode = { code: 400, name: 'Bad Request' } as const;
    static readonly Unauthorized: StatusCode = { code: 401, name: 'Unauthorized' } as const;
    static readonly Forbidden: StatusCode = { code: 403, name: 'Forbidden' } as const;
    static readonly NotFound: StatusCode = { code: 404, name: 'Not Found' } as const;
    static readonly MethodNotAllowed: StatusCode = { code: 405, name: 'Method Not Allowed' } as const;
    static readonly NotAcceptable: StatusCode = { code: 406, name: 'Not Acceptable' } as const;
    static readonly PreconditionFailed: StatusCode = { code: 412, name: 'Precondition Failed' } as const;
    static readonly UnsupportedMediaType: StatusCode = { code: 415, name: 'Unsupported Media Type' } as const;

    // 5xx: Server Error
    static readonly InternalServerError: StatusCode = { code: 500, name: 'Internal Server Error' } as const;
    static readonly NotImplemented: StatusCode = { code: 501, name: 'Not Implemented' } as const;
}
