// panel/ts/EditPanel.ts
import {DOMAIN_WEB,DOMAIN_QONLY_WEB} from '../../global';

export const GET_OBJECT_SCHEMA_ENDPOINT = `${DOMAIN_QONLY_WEB()}/api/get-object-schema`;//'http://localhost:3001/api/get-object-schema';
export const UPDATE_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/update-object`;//'http://localhost:3000/api/update-object';
export const COL_LIST_ENDPOINT = `${DOMAIN_QONLY_WEB()}/api/colList`;//'http://localhost:3001/api/colList';

export interface ShowFormPayload {
  tableName: string;
  objectId?: string;
}

export interface ShowFormResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UpdateColumnItem {
  col_name: string;
  value: any;
}

export interface UpdateObjectPayload {
  tableName: string;
  recordid: string;
  sessionid?: string;
  columns: UpdateColumnItem[];
}

export interface UpdateObjectResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface GetListPayload {
  col_id: string;
}

export interface GetListResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Fetches the object schema details for the EditPanel component.
 */
export async function showForm(
  payload: ShowFormPayload,
  endpoint: string = GET_OBJECT_SCHEMA_ENDPOINT
): Promise<ShowFormResult> {
  const tableName = payload?.tableName?.trim();

  console.log("EditPanel.ts showForm > ", JSON.stringify(payload));

  if (!tableName) {
    return {
      success: false,
      error: "Missing required parameter 'ObjectId'.",
    };
  }

  try {
    const apiPayload: ShowFormPayload = { tableName };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('Error in showForm:', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch object schema',
    };
  }
}

/**
 * Submits updated record fields back to the backend.
 * Calls http://localhost:3000/api/update-object (configurable).
 * Payload: { tableName: objectid, recordid: recordid, sessionid: '', columns: [{ col_name: '', value: '' }] }
 */
export async function updateObject(
  payload: UpdateObjectPayload,
  endpoint: string = UPDATE_OBJECT_ENDPOINT
): Promise<UpdateObjectResult> {
  const tableName = payload?.tableName?.trim();
  const recordId = payload?.recordid?.trim();
  //console.log("handleSave -> EditPanel.ts -> updateObject", JSON.stringify(payload));
  if (!tableName || !recordId) {
    return {
      success: false,
      error: "Missing required parameters 'tableName' or 'recordid'.",
    };
  }

  try {
    const apiPayload = {
      tableName,
      recordid: recordId,
      sessionid: payload.sessionid || '',
      columns: payload.columns || [],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('Error in updateObject:', err);
    return {
      success: false,
      error: err?.message || 'Failed to update object',
    };
  }
}

/**
 * Fetches list options for a given column ID (col_id).
 */
export async function getList(
  payload: GetListPayload,
  endpoint: string = COL_LIST_ENDPOINT
): Promise<GetListResult> {
  const colId = payload?.col_id?.trim();

  if (!colId) {
    return {
      success: false,
      error: "Missing required parameter 'col_id'.",
    };
  }

  try {
    const apiPayload: GetListPayload = { col_id: colId };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err: any) {
    console.error('Error in getList:', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch column list options',
    };
  }
}

export default showForm;