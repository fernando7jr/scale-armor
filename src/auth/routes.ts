import { Routing, RequestParams, ServiceHookContext } from "../core/routing";
import { NotAuthenticated } from "@feathersjs/errors";
import { UserAccessType, User } from "./model";
import { AuthService } from "./service";
import { PersistedModelService } from "../core/persisted-model";
import { ConstructorOf } from "../utils";


export type ConstructorOfModel<T> = ConstructorOf<PersistedModelService<T>>

/**
 * Base class for implementing your own auth routes
 * Use getAuthHook for applying a security layer to your endpoints or
 * use validateToken to validate the incoming tokens on your own
 *
 * @export
 * @class AuthRoutes
 * @extends {Routing}
 * @template TAccessType
 * @template T
 */
export class AuthRoutesBase<TAccessType extends UserAccessType, T extends User<TAccessType>> extends Routing {
    protected service = new AuthService();
    protected constructor(private userModelClass: ConstructorOfModel<T>, name?: string) {
        super(name);
    }

    /**
     * Return an auth hook for endpoints
     *
     * @static
     * @template TAccessType
     * @template T
     * @param {ConstructorOfModel<T>} userModelClass
     * @param {TAccessType} [minimumAccessLevel]
     * @returns {async (context: ServiceHookContext) => ServiceHookContext}
     * @memberof AuthRoutesBase
     */
    static getAuthHook<TAccessType extends UserAccessType, T extends User<TAccessType>>( 
        userModelClass: ConstructorOfModel<T>,
        minimumAccessLevel?: TAccessType
    ) {
        const auther = new this(userModelClass);
        return auther.getAuthHook(minimumAccessLevel);
    }

    /**
     * Return an auth hook for endpoints
     *
     * @param {TAccessType} [minimumAccessLevel]
     * @returns {async (context: ServiceHookContext) => ServiceHookContext}
     * @memberof AuthRoutesBase
     */
    getAuthHook(minimumAccessLevel?: TAccessType) {
        return async (context: ServiceHookContext) => {
            const authenticated = await this.validateToken(context.params, minimumAccessLevel);
            if (!authenticated) {
                throw new NotAuthenticated("Not authenticated!");
            }
            return context;
        }
    }

    /**
     * Return a new model service
     *
     * @protected
     * @returns {PersistedModelService<T>}
     * @memberof AuthRoutesBase
     */
    protected getModelService(): PersistedModelService<T> {
        return new this.userModelClass();
    }

    /**
     * Validate a given token and return it is valid or not
     *
     * @param {RequestParams} [params]
     * @param {UserAccessType} [minimumAccessLevel]
     * @returns {Promise<boolean>}
     * @memberof AuthRoutesBase
     */
    async validateToken(params?: RequestParams, minimumAccessLevel?: UserAccessType): Promise<boolean> {
        if (
            !params || 
            !params.headers || 
            !params.headers.token || 
            typeof params.headers.token !== 'string'
        ) {
            return false;
        }
        const token = this.service.newToken(params.headers.token);
        const model = this.getModelService();
        const user_id = token.decode().z;
        const user = await model.findById(user_id);
        if (!user) {
            return false;
        }
        const hasAccess = await this.service.hasAccess(user, minimumAccessLevel);
        if (!hasAccess) {
            return false;
        }
        params.user = user;
        return true;
    }
}
