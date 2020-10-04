import { Request, Params } from "../app/request";
import { PagingOptions } from "../utils";

export interface Context extends Partial<PagingOptions> {
    readonly request: Request;
    readonly query: Params;
    readonly page?: number;
    readonly pageSize?: number;
}
