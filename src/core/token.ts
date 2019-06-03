import jwt from "jwt-simple";

export class Jwt {
    constructor (private secret: string) {

    }

    encode(payload?: any) {
        return jwt.encode(payload || {}, this.secret);
    }

    decode(token: string) {
        return jwt.decode(token, this.secret);
    }
}

export interface TokenPayload {
    z: string;  // username
}

export class Token {
    private static encoder = new Jwt('feira@livre-e-o-chefe-para-gastronomia!');
    private __hash: string;
    constructor (hash: string) {
        this.__hash = hash;
    }

    public static for(payload?: TokenPayload): Token {
        return new this(this.encoder.encode(payload));
    }

    public get hashed() {
        return this.__hash;
    }

    public toString(): string {
        return this.__hash;
    }

    public decode(): TokenPayload {
        return Token.encoder.decode(this.__hash);
    }
}
