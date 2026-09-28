// apiService.ts
import type { MenuItem } from './types';

// API Endpoints & Base Configuration
const API_BASE_URL = 'http://localhost:3000';
const QUERY_OBJECT_ENDPOINT = `${API_BASE_URL}/api/query-object`;
const QUERY_OBJECT_IN_TABLE_ENDPOINT = `${API_BASE_URL}/api/query-object-in-table`;
const SAVE_OBJECT_ENDPOINT = `${API_BASE_URL}/api/save-object`;
const GET_OBJECT_SCHEMA_ENDPOINT = 'http://localhost:3001/api/get-object-schema';
const COL_LIST_ENDPOINT = 'http://localhost:3001/api/colList';

export interface APIPayload {
  id: string;
  sessionid: string;
}

export interface WhereClauseItem {
  col_name: string;
  value: string | number;
  type: string;
  operator: string;
}

export interface QueryObjectPayload {
  tableName?: string;
  objectid?: string;
  whereClause: WhereClauseItem[];
}

export interface ShowFormPayload {
  objectid: string;
  sessionId?: string;
}

export interface GetListPayload {
  col_id: string;
  [key: string]: any;
}

export interface GetObjectRecordsPayload {
  tableName?: string;
  objectid?: string;
  whereClause: any[];
}

export interface SaveColumnItem {
  col_name: string;
  value: string | number;
}

export interface DoSavePayload {
  tableName: string;
  columns: SaveColumnItem[];
}

// Simulated API call for layout
export const fetchAPI1 = async (payload: APIPayload): Promise<MenuItem[]> => {
  console.log('Calling API1 with:', payload);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: `${payload.id}_1`, label: `${payload.id} - Menu 1`, val: 'Value 1', formid: 'form_001' },
        { id: `${payload.id}_2`, label: `${payload.id} - Menu 2`, val: 'Value 2', formid: 'form_002' },
        { id: `${payload.id}_3`, label: `${payload.id} - Menu 3`, val: 'Value 3', formid: 'form_003' },
      ]);
    }, 500);
  });
};

/**
 * Loads menu items from backend API via POST and captures formid field
 * @param level - Numeric level filter (e.g. 2)
 * @param pid - Parent ID string UUID filter
 */
export const menuLoader = async (level: number, pid: string): Promise<MenuItem[]> => {
  const payload: QueryObjectPayload = {
    objectid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
    whereClause: [
      { col_name: 'level', value: level, type: 'INT', operator: '=' },
      { col_name: 'pid', value: pid, type: 'VARCHAR', operator: '=' },
    ],
  };

  try {
    const response = await fetch(QUERY_OBJECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    // JSON response automatically maps object properties, including 'formid'
    const data: MenuItem[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling menuLoader API:', error);
    throw error;
  }
};

/**
 * Fetches table records by posting a JSON query configuration payload
 * @param queryParams - JSON object containing query details
 */
export const getTableRecords = async <T = any>(queryParams: object): Promise<T> => {
  try {
    console.log("before getTableRecords ", JSON.stringify(queryParams));
    const response = await fetch(QUERY_OBJECT_IN_TABLE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryParams),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data: T = await response.json();

    return data;
  } catch (error) {
    console.error('Error calling getTableRecords API:', error);
    throw error;
  }
};

/**
 * Fetches form layout and column definitions for a given object schema
 * @param payload - Object containing objectid and optional sessionId
 */
export const showForm = async <T = any>(payload: ShowFormPayload): Promise<T> => {
  try {
    console.log("before showForm ", JSON.stringify(payload));
    const response = await fetch(GET_OBJECT_SCHEMA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling showForm API:', error);
    throw error;
  }
};

/**
 * Fetches column list options dynamically using col_id
 * @param payload - Object containing col_id parameter
 */
export const getList = async <T = any>(payload: GetListPayload): Promise<T> => {
  try {
    console.log("before getList ", JSON.stringify(payload));
    const response = await fetch(COL_LIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data: T = await response.json();
    console.log("getList request ", JSON.stringify(payload), " result: ", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error calling getList API:', error);
    throw error;
  }
};

/**
 * Fetches object records by calling query-object endpoint
 * @param payload - Object containing tableName and whereClause
 */
export const getObjectRecords = async <T = any>(payload: GetObjectRecordsPayload): Promise<T> => {
  try {
    const response = await fetch(QUERY_OBJECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }
    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling getObjectRecords API:', error);
    throw error;
  }
};

/**
 * Saves object configuration data by calling save-object endpoint
 * @param payload - Object containing tableName and columns array
 */
export const doSave = async <T = any>(payload: DoSavePayload): Promise<T> => {
  try {
    console.log("before doSave ", JSON.stringify(payload));
    const response = await fetch(SAVE_OBJECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling doSave API:', error);
    throw error;
  }
};