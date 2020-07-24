import Express from 'express';
import {
    Request as ExpressRequest,
    Response as ExpressResponse,
    ParamsDictionary as ExpressParamsDictionary
} from 'express-serve-static-core';
import expressAsyncHandler from 'express-async-handler';
import { ParsedQs } from 'qs';
import { App, Request, Params, Headers, Response } from '../app';
import { Method } from '../router';

type ExpressRequestContext = ExpressRequest<ExpressParamsDictionary, any, any, ParsedQs>;


export class Server {
    private expressApp = Express();

    private getRequest(req: ExpressRequestContext): Request {
        return {
            headers: req.headers as unknown as Headers,
            method: req.method as Method,
            params: req.query as Params,
            path: req.path,
            body: req.body,
            get json() {
                return JSON.parse(req.body);
            }
        };
    }

    private sendResponse(res: ExpressResponse<any>, response: Response): void {
        res.contentType(response.contentType);
        res.set(response.headers);
        res.status(response.status.code).send(response.body);
    }

    async resolve(app: App, req: ExpressRequestContext, res: ExpressResponse<any>, before: Function[], after: Function[]) {
        let request = this.getRequest(req);
        
        // Before hooks
        request = before.reduce((request, hook) => {
            return hook(request);
        }, request);

        const responseBuilder = await app.resolve(request);
        let response = responseBuilder.build();

        // After hooks
        response = after.reduce((response, hook) => {
            return hook(response);
        }, response);

        this.sendResponse(res, responseBuilder);
    }

    add(app: App, before?: Function[], after?: Function[]): this {
        const _before = before || [];
        const _after = after || [];
        this.expressApp.all(app.name, expressAsyncHandler(async (req, res) => {
            return await this.resolve(app, req, res, _before, _after);
        }));
        return this;
    }

    get mainApp() {
        return this.expressApp;
    }
}


/** handle GET request */
function getHandler(req, res, reqUrl) {
    res.writeHead(200);
    res.write('GET parameters: ' + reqUrl.searchParams);
    res.end();
}

/** handle POST request */
function postHandler(req, res, reqUrl) {
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
        res.writeHead(200);
        res.write('POST parameters: ' + chunk);
        res.end();
    });
}

/** if there is no related function which handles the request, then show error message */
function noResponse(req, res) {
    res.writeHead(404);
    res.write('Sorry, but we have no response..\n');
    res.end();
}

http.createServer((req, res) => {
    // create an object for all redirection options
    const router = {
        'GET/retrieve-data': getHandler,
        'POST/send-data': postHandler,
        'default': noResponse
    };
    // parse the url by using WHATWG URL API
    let reqUrl = new URL(req.url, 'http://127.0.0.1/');
    // find the related function by searching "method + pathname" and run it
    let redirectedFunc = router[req.method + reqUrl.pathname] || router['default'];
    redirectedFunc(req, res, reqUrl);
}).listen(8080, () => {
    console.log('Server is running at http://127.0.0.1:8080/');
});
