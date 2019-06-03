/**
 * Base64 helper class
 *
 * @export
 * @class Base64
 */
export class Base64 {
    /**
     * Encode data to base64
     *
     * @param {string} data
     * @returns {string}
     * @memberof Base64
     */
    toBase64(data: string): string {
        return Buffer.from(data).toString('base64');
    }

    /**
     * Decode data from base64
     *
     * @param {string} data
     * @returns {string}
     * @memberof Base64
     */
    fromBase64(data: string): string {
        return Buffer.from(data, 'base64').toString('ascii');
    }
}
