import { Model } from "../core";

/**
 * Enum for AccessType
 * Extend this enum to add your own custom access levels
 *
 * @export
 * @enum {number}
 */
export enum UserAccessType {
    None = 0,
    Normal = 1,
    Admin = 99
}

/**
 * Base interface for User entry
 * Extend this interface to add your own properties
 *
 * @export
 * @interface User
 * @template T
 */
export interface User<T extends UserAccessType> extends Model {
    accessType: T;
}
