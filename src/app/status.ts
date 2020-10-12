/**
 * The interface for a StatusCode object
 */
export interface StatusCode {
    /**
     * The integer representation for the status code
     */
    readonly code: number;

    /**
     * The name of the status code
     */
    readonly name: string;
}

/**
 * Organize the most common HTTP Status Codes
 * Feel free to expand it as you need
 */
export class StatusCodes {
    private constructor() { }

    // Extracted from: https://restfulapi.net/http-status-codes/

    // 2xx: Success
    /** Ok: { code: 200, name: 'Ok' } */
    static readonly Ok: StatusCode = { code: 200, name: 'Ok' } as const;
    /** Created: { code: 201, name: 'Created' } */
    static readonly Created: StatusCode = { code: 201, name: 'Created' } as const;
    /** Accepted: { code: 202, name: 'Accepted' } */
    static readonly Accepted: StatusCode = { code: 202, name: 'Accepted' } as const;
    /** NoContent: { code: 204, name: 'No Content' } */
    static readonly NoContent: StatusCode = { code: 204, name: 'No Content' } as const;

    // 3xx: Redirection
    /** MovedPermanently: { code: 301, name: 'Moved Permanently' } */
    static readonly MovedPermanently: StatusCode = { code: 301, name: 'Moved Permanently' } as const;
    /** Found: { code: 302, name: 'Found' } */
    static readonly Found: StatusCode = { code: 302, name: 'Found' } as const;
    /** SeeOther: { code: 303, name: 'See Other' } */
    static readonly SeeOther: StatusCode = { code: 303, name: 'See Other' } as const;
    /** NotModified: { code: 304, name: 'Not Modified' } */
    static readonly NotModified: StatusCode = { code: 304, name: 'Not Modified' } as const;
    /** TemporaryRedirect: { code: 307, name: 'Temporary Redirect' } */
    static readonly TemporaryRedirect: StatusCode = { code: 307, name: 'Temporary Redirect' } as const;

    // 4xx: Client Error
    /** BadRequest: { code: 400, name: 'Bad Request' } */
    static readonly BadRequest: StatusCode = { code: 400, name: 'Bad Request' } as const;
    /** Unauthorized: { code: 401, name: 'Unauthorized' } */
    static readonly Unauthorized: StatusCode = { code: 401, name: 'Unauthorized' } as const;
    /** Forbidden: { code: 403, name: 'Forbidden' } */
    static readonly Forbidden: StatusCode = { code: 403, name: 'Forbidden' } as const;
    /** NotFound: { code: 404, name: 'Not Found' } */
    static readonly NotFound: StatusCode = { code: 404, name: 'Not Found' } as const;
    /** MethodNotAllowed: { code: 405, name: 'Method Not Allowed' } */
    static readonly MethodNotAllowed: StatusCode = { code: 405, name: 'Method Not Allowed' } as const;
    /** NotAcceptable: { code: 406, name: 'Not Acceptable' } */
    static readonly NotAcceptable: StatusCode = { code: 406, name: 'Not Acceptable' } as const;
    /** PreconditionFailed: { code: 412, name: 'Precondition Failed' } */
    static readonly PreconditionFailed: StatusCode = { code: 412, name: 'Precondition Failed' } as const;
    /** UnsupportedMediaType: { code: 415, name: 'Unsupported Media Type' } */
    static readonly UnsupportedMediaType: StatusCode = { code: 415, name: 'Unsupported Media Type' } as const;

    // 5xx: Server Error
    /** InternalServerError: { code: 500, name: 'Internal Server Error' } */
    static readonly InternalServerError: StatusCode = { code: 500, name: 'Internal Server Error' } as const;
    /** Not Implemented: { code: 501, name: 'Not Implemented' } */
    static readonly NotImplemented: StatusCode = { code: 501, name: 'Not Implemented' } as const;
}
