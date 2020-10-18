import { Request, Params } from "../app/request";
import { PaginationOptions } from "../utils";

/**
 * Context organizes the parsed information of the request
 * @interface
 */
export interface Context extends Partial<PaginationOptions> {
    /**
     * The original request object
     * @readonly
     * @type {Request}
     */
    readonly request: Request;
    /**
     * The parsed request params (query string)
     * @readonly
     * @type {Params}
     */
    readonly query: Params;
}
