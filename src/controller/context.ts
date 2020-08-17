import { Request, Params } from "../app/request";

export interface Context {
    readonly request: Request;
    readonly query: Params;
    readonly page?: number;
    readonly pageSize?: number;
}
