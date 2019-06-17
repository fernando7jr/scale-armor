import jwt from "jwt-simple";
/**
 * JWT helper class
 *
 * @export
 * @class Jwt
 */
export class Jwt {
    constructor (private secret: string) {

    }

    /**
     * encode a payload to jwt
     *
     * @param {*} [payload]
     * @returns
     * @memberof Jwt
     */
    encode(payload?: any) {
        return jwt.encode(payload || {}, this.secret);
    }

    /**
     * Decode a jwt and retrieve the payload
     *
     * @param {string} token
     * @returns
     * @memberof Jwt
     */
    decode(token: string) {
        return jwt.decode(token, this.secret);
    }
}

export interface TokenPayload {
    z: string;  // username
}

/**
 * JWT Token class
 *
 * @export
 * @class Token
 */
export class Token {
    private static encoder: Jwt;
    private __hash: string;
    constructor (hash: string) {
        this.__hash = hash;
    }

    /**
     * Register the `secret` used for jwt encryption
     *
     * @static
     * @param {string} secret
     * @memberof Token
     */
    public static registerJwtSecret(secret: string) {
        this.encoder = new Jwt(secret);
    }

    /**
     * Generate a new token for the paylaod
     *
     * @static
     * @param {TokenPayload} [payload]
     * @returns {Token}
     * @memberof Token
     */
    public static for(payload?: TokenPayload): Token {
        return new this(this.encoder.encode(payload));
    }

    /**
     * Get the encrypted hash
     *
     * @readonly
     * @memberof Token
     */
    public get hashed() {
        return this.__hash;
    }

    /**
     * Return the encrypted hash
     *
     * @returns {string}
     * @memberof Token
     */
    public toString(): string {
        return this.__hash;
    }

    /**
     * Decode the token and retrieve the payload
     *
     * @returns {TokenPayload}
     * @memberof Token
     */
    public decode(): TokenPayload {
        return Token.encoder.decode(this.__hash);
    }
}
