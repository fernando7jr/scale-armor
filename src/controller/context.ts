import { Request, Params } from "../app/request";
import { PaginationOptions } from "../utils";

export interface Context extends Partial<PaginationOptions> {
    readonly request: Request;
    readonly query: Params;
    readonly page?: number;
    readonly pageSize?: number;
}
