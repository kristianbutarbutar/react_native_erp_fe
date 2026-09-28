// panel/ts/ObjectRecords.ts
import { getTableRecords, type WhereClauseItem } from '../../apiService';

export interface TableRecordsPayload {
    tableName: string;
    whereClause?: WhereClauseItem[] | any[];
    row_start?: number;
    row_end?: number;
    [key: string]: any;
}

/**
 * Fetches table records by posting query pagination and filter parameters to getTableRecords.
 *
 * @param payload - Query configuration containing tableName, whereClause, row_start, and row_end
 * @returns Promise resolving to the getTableRecords API response
 */
export async function tableRecords<T = any>(
    payload: TableRecordsPayload
): Promise<T> {
    try {
        const queryParams = {
            tableName: payload.tableName,
            whereClause: payload.whereClause ?? [],
            row_start: payload.row_start ?? 1,
            row_end: payload.row_end ?? 10,
        };

        console.log('Calling tableRecords with payload:', JSON.stringify(queryParams));
        const response = await getTableRecords<T>(queryParams);
        return response;
    } catch (error) {
        console.error('Error in tableRecords (ObjectRecords.ts):', error);
        throw error;
    }
}

export default tableRecords;