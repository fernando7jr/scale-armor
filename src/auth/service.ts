import { Token, Jwt } from "../core/token";
import { User, UserAccessType } from "./model";
import { RequestParams } from "../core/routing";
import { PersistedModel } from "../core/persisted-model";


class SecretPasswordEncoder extends Jwt {
    constructor(private password: string) {
        super(password + "@Pd12342fw8f109ffh");
    }

    static for(password: string, username: string): string {
        return new this(password).encode({z: username});
    }
    
    static decode(password: string, token: string): string {
        return new this(password).decode(token).z;
    }
}



export class AuthService<TAccessType extends UserAccessType, T extends User<TAccessType>, TModel extends PersistedModel<T>> {
    encodePassword(password: string, username: string): string {
        // return SecretPasswordEncoder.for(password, username);
        return password;
    }

    decodePassword(password: string, token: string): string {
        // return SecretPasswordEncoder.decode(password, token);
        return password;
    }

    async validateToken(model: TModel, token: Token, minimAccessLevel?: TAccessType): Promise<boolean> {
        const user_id = token.decode().z;
        const user = await model.findById(user_id);
        minimAccessLevel = minimAccessLevel || UserAccessType.None as TAccessType;
        if (!user) {
            return false;
        }
        const userAccessLevel = user.accessType || UserAccessType.None;
        return userAccessLevel >= minimAccessLevel;
    }

    async getUser(model: TModel, username: string, password: string) {
        const hashed = this.encodePassword(password, username);
        return await model.findOne({username: username, auth: hashed});
    }

    tokenFor(user: T | string): Token {
        const user_id = (typeof user === 'string' ? user : user._id) || '';
        return Token.for({z: user_id});
    }

    newToken(token: RequestParams |  string): Token {
        const t = (typeof token === 'string' ? token : token.headers.token) || '';
        return new Token(t);
    }
}
