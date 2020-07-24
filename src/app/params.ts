import { parse as qsParse } from 'qs';

export type ParamsPrimitives = string | number | boolean | null | undefined;
export type Params = { [key: string]: ParamsPrimitives | Array<ParamsPrimitives> | any };

const numbers = new RegExp('^\d+(.\d+)?$');
export function parseParams(paramsString: string): Params {
    return qsParse(paramsString, {
        allowDots: true,
        parseArrays: true,
        decoder: (str, defaultDecoder, charset, type) => {
            if (type === 'key') {
                return defaultDecoder(str);
            } else if (!str) {
                return null;
            } else if (numbers.exec(str)) {
                return str.includes('.') ? parseFloat(str) : parseInt(str, 10);
            } else if (str === 'true' || str === 'false') {
                return str === 'true';
            }
            return defaultDecoder(str, defaultDecoder, charset);
        }
    });
}
