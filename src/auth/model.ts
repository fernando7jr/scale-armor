export enum UserAccessType {
    None = 0,
    Normal = 1,
    Admin = 99
}

export interface User<T extends UserAccessType> {
    _id?: string;
    accessType: T;
}
