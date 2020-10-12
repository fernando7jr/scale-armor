/**
 * Interface for pagination options
 */
export interface PaginationOptions {
    /** The desired page. Starts at 1 */
    page: number;
    /** The size of each page */
    pageSize: number;
    /** The property name to use for sorting the data */
    sortBy: string;
    /**
     * The type of sorting
     * 1 for Ascending
     * -1 for Descending
     */
    sortType: 1 | -1;
}

/**
 * Interface for PaginatedData
 * @template T - the data type
 */
export interface PaginatedData<T> {
    /** The data array */
    data: T[];
    /** The requested page */
    page: number;
    /** The size of each page */
    pageSize: number;
    /** The last page which can be fetched */
    lastPage: number;
    /** The total length of the available data, counting from the first page until the last one */
    total: number;
}
