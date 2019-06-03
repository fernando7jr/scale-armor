import { RequestHandler } from "express";

export const HeadersHandler: RequestHandler = function (req, res, next) {
    (<any>req).feathers.headers = req.headers;
    next();
}