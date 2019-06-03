import { Token, Jwt } from "../core/token";
import { User, UserAccessType } from "./model";
import { RequestParams } from "../core/routing";
import { PersistedModelService } from "../core/persisted-model";


// class SecretPasswordEncoder extends Jwt {
//     constructor(private password: string) {
//         super(password + "@Pd12342fw8f109ffh");
//     }

//     static for(password: string, username: string): string {
//         return new this(password).encode({z: username});
//     }
    
//     static decode(password: string, token: string): string {
//         return new this(password).decode(token).z;
//     }
// }

/**
 * Authentication service for {Token} generation and validation
 *
 * @export
 * @class AuthService
 * @template TAccessType
 * @template T
 * @template TModel
 */
export class AuthService<TAccessType extends UserAccessType, T extends User<TAccessType>, TModel extends PersistedModelService<T>> {
    /**
     * Encode the password to store in the database
     *
     * @param {string} password
     * @param {string} username
     * @returns {string}
     * @memberof AuthService
     */
    encodePassword(password: string, username: string): string {
        // return SecretPasswordEncoder.for(password, username);
        return password;
    }

    /**
     * Decode the password
     *
     * @param {string} password
     * @param {string} token
     * @returns {string}
     * @memberof AuthService
     */
    decodePassword(password: string, token: string): string {
        // return SecretPasswordEncoder.decode(password, token);
        return password;
    }

    /**
     * Validate the token is valid or not
     *
     * @param {TModel} model
     * @param {Token} token
     * @param {TAccessType} [minimAccessLevel]
     * @returns {Promise<boolean>}
     * @memberof AuthService
     */
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

    /**
     * Get the user using the username and password
     *
     * @param {TModel} model
     * @param {string} username
     * @param {string} password
     * @returns
     * @memberof AuthService
     */
    async getUser(model: TModel, username: string, password: string) {
        const hashed = this.encodePassword(password, username);
        return await model.findOne({username: username, auth: hashed});
    }

    /**
     * Generate a new token for the user
     *
     * @param {(T | string)} user
     * @returns {Token}
     * @memberof AuthService
     */
    tokenFor(user: T | string): Token {
        const user_id = (typeof user === 'string' ? user : user._id) || '';
        return Token.for({z: user_id});
    }

    /**
     * Return a new token using the request data or string
     *
     * @param {(RequestParams |  string)} token
     * @returns {Token}
     * @memberof AuthService
     */
    newToken(token: RequestParams |  string): Token {
        const t = (typeof token === 'string' ? token : token.headers.token) || '';
        return new Token(t);
    }
}
