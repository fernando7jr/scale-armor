import { Request } from "../app/request";

export interface Context {
    readonly request: Request;
    readonly page?: number;
    readonly pageSize?: number;
}
