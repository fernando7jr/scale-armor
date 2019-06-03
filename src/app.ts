import feathers from '@feathersjs/feathers';
import express, { Application } from '@feathersjs/express';
import configuration from '@feathersjs/configuration';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { Routing } from './core/routing';
import { getCatchHandler } from './middleware/catch';
import { HeadersHandler } from './middleware/headers';
import { LoggerHandler } from './middleware/logger';import { ConfigStorage } from './core/config';


export type ServerApplication = Application<object>;
export class Serverlet {
    private __app: ServerApplication;
    constructor() {
        this.__app = express(feathers());
    }

    installRoutingProvider(routingProvider: Routing[]): Serverlet
    installRoutingProvider(routingProvider: Routing): Serverlet
    installRoutingProvider(routingProvider: Routing | Routing[]): Serverlet {
        if (Array.isArray(routingProvider)) {
            routingProvider.forEach(provider => this.installRoutingProvider(provider));
            return this;
        }
        const endpoints = routingProvider.getEndpoints();
        const hooks = routingProvider.hooks;
        for (const key in endpoints) {
            this.__app.use(key, endpoints[key]);
            this.__app.service(key).hooks(hooks);
        }
        return this;
    }

    get app() {
        return this.__app;
    }

    setup() {
        this.__app
            .configure(configuration())
            .configure(express.rest())
            .use(bodyParser.urlencoded({extended: true}))
            .use(bodyParser.json())
            .use(HeadersHandler)
            .use(cors())
            .use(LoggerHandler)
            ;
        ConfigStorage.registerApp(this.__app);
        return this;
    }

    middleware() {
        this.__app
            .use(getCatchHandler(true))
            // .use(LoggerHandler)
            ;
        return this;
    }
}
