import { Routing, RequestParams, ServiceHookContext } from "../core/routing";
import { NotAuthenticated } from "@feathersjs/errors";
import { UserAccessType, User } from "./model";
import { AuthService } from "./service";
import { PersistedModel } from "../core/persisted-model";


export abstract class AuthRoutes<TAccessType extends UserAccessType, T extends User<TAccessType>, TModel extends PersistedModel<T>> extends Routing {
    private service = new AuthService();
    constructor(name?: string) {
        super(name);
    }

    protected getAuthHook(auther: this, minimAccessLevel?: TAccessType) {
        return async (context: ServiceHookContext) => {
            const authenticated = await auther.validateToken(context.params, minimAccessLevel);
            if (!authenticated) {
                throw new NotAuthenticated("Not authenticated!");
            }
            return context;
        }
    }

    protected abstract getModel(): TModel;

    async validateToken(params?: RequestParams, minimAccessLevel?: UserAccessType): Promise<boolean> {
        if (
            !params || 
            !params.headers || 
            !params.headers.token || 
            typeof params.headers.token !== 'string'
        ) {
            return false;
        }
        const model = this.getModel();
        const token = this.service.newToken(params.headers.token);
        return await this.service.validateToken(model, token, minimAccessLevel);
    }
}
