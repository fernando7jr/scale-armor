import { parse as qsParse } from 'qs';

/** The acceptable primitives for a value in Params */
export type ParamsPrimitives = string | number | boolean | null | undefined;
/** The Params from a request query string */
export type Params = { [key: string]: ParamsPrimitives | Array<ParamsPrimitives> | any; };


const numbers = new RegExp('^\d+(.\d+)?$');
/** 
 * Parse a query string to a Params object 
 * @param {string} paramsString - a valid query string
 * @returns {Params}
 */
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
