export interface PagingOptions {
    page: number;
    pageSize: number;
    sortBy: string;
    sortType: 1 | -1;
}

export interface PagedData<T> {
    data: T[];
    page: number;
    pageSize: number;
    lastPage: number;
    total: number;
}
