/**
 * Interface for pagination options
 */
export interface PaginationOptions {
    page: number;
    pageSize: number;
    sortBy: string;
    sortType: 1 | -1;
}

export interface PaginatedData<T> {
    data: T[];
    page: number;
    pageSize: number;
    lastPage: number;
    total: number;
}
