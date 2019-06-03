export class Base64 {
    toBase64(data: string): string {
        return Buffer.from(data).toString('base64');
    }
    fromBase64(data: string): string {
        return Buffer.from(data, 'base64').toString('ascii');
    }
}
