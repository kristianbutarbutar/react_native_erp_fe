// src/panel/ts/SearchPanel.ts
import { getTableRecords } from './../../apiService';

export interface SearchWhereItem {
  col_name: string;
  value: string | number;
  operator?: string;
  [key: string]: any;
}

export interface DoSearchPayload {
  objectid: string;
  search: SearchWhereItem[];
  sessionId?: string;
  row_start?: number;
  row_end?: number;
}

/**
 * Performs a record search by validating inputs, filtering out empty values, 
 * and calling getTableRecords
 * @param payload - Object containing objectid and search filter array
 */
export const doSearch = async <T = any>(payload: DoSearchPayload): Promise<T> => {
  const trimmedObjectId = payload.objectid?.trim();
  if (!trimmedObjectId) {
    throw new Error('Missing required parameter: objectid');
  }

  // Validate and rewrap input parameters: only include search items that have a valid value
  const validWhereClause = (payload.search || [])
    .filter((item) => {
      if (!item || !item.col_name) return false;
      const val = item.value;
      return val !== '' && val !== null && val !== undefined;
    })
    .map((item) => ({
      col_name: item.col_name.trim(),
      value: item.value,
      operator: item.operator || ' like ',
    }));

  const queryPayload = {
    tableName: trimmedObjectId,
    sessionId: payload.sessionId || '',
    whereClause: validWhereClause,
    row_start: payload.row_start || 1,
    row_end: payload.row_end || 10,
  };
  //console.log('Calling doSearch getTableRecords with validated payload:', JSON.stringify(queryPayload));
  try {
    const result = await getTableRecords(queryPayload);
    //console.log('Calling doSearch result:', JSON.stringify(result));
    return result as T;
  } catch (error) {
    console.error('Error calling doSearch API:', error);
    throw error;
  }
};