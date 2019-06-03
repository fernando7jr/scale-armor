import feathers from '@feathersjs/feathers';
import express, { Application } from '@feathersjs/express';
import configuration from '@feathersjs/configuration';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { Routing } from './core/routing';
import { getCatchHandler } from './middleware/catch';
import { HeadersHandler } from './middleware/headers';
import { LoggerHandler } from './middleware/logger';import { ConfigStorage } from './core/config';


export type ScaleArmorApplication = Application<object>;

export class ScaleArmorServerlet {
    private __app: ScaleArmorApplication;
    constructor() {
        this.__app = express(feathers());
    }

    /**
     * Install the routing provider to add its endpoints to the serverlet
     *
     * @param {Routing[]} routingProvider
     * @returns {ScaleArmorServerlet}
     * @memberof ScaleArmorServerlet
     */
    installRoutingProvider(routingProvider: Routing[]): ScaleArmorServerlet
    installRoutingProvider(routingProvider: Routing): ScaleArmorServerlet
    installRoutingProvider(routingProvider: Routing | Routing[]): ScaleArmorServerlet {
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

    /**
     * Get the `express` app
     *
     * @readonly
     * @memberof ScaleArmorServerlet
     */
    get app() {
        return this.__app;
    }

    /**
     * Setup the app with the basic configuration
     *
     * @returns
     * @memberof ScaleArmorServerlet
     */
    setup() {
        this.__app
            .configure(configuration())
            .configure(express.rest())
            .use(bodyParser.urlencoded({extended: true}))
            .use(bodyParser.json())
            .use(HeadersHandler)
            .use(cors())
            .use(LoggerHandler);
        ConfigStorage.registerApp(this.__app);
        return this;
    }

    /**
     * Apply the middlewares
     *
     * @returns
     * @memberof ScaleArmorServerlet
     */
    middleware() {
        this.__app
            .use(getCatchHandler(true))
            // .use(LoggerHandler)
            ;
        return this;
    }
}
