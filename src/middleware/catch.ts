import express, {Response, Request, ErrorRequestHandler, NextFunction} from '@feathersjs/express';

export const getCatchHandler = function (useStack?: boolean) {
    const handler = function (
        error: Error  & {code?: number, status?: number}, 
        req: Request, 
        res: Response, 
        next: NextFunction
    ) {
        if (useStack) {
            console.error(error);   
        }
        const status = error.code || error.status || 500;
        res.status(status).send({message: error.message, code: status});
        console.log("Response: ", req.method, '-', req.path, ' ', res.statusCode, res.statusMessage);
    };
    return express.errorHandler({
        html: handler,
        json: handler,
    })
}