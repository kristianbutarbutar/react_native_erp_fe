// panel/ts/NewPanel.ts
import { DOMAIN_WEB, DOMAIN_QONLY_WEB } from '../../global';

export const GET_OBJECT_SCHEMA_ENDPOINT = `${DOMAIN_QONLY_WEB()}/api/get-object-schema`;
export const CREATE_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/save-object`;
export const COL_LIST_ENDPOINT = `${DOMAIN_QONLY_WEB()}/api/colList`;

export interface ShowFormPayload {
  tableName: string;
  src: string;
}

export interface ShowFormResult {
  success: boolean;
  sessionToken?: string;
  data?: any;
  error?: string;
}

export interface CreateColumnItem {
  col_name: string;
  value: any;
}

export interface CreateFormPayload {
  sessionToken?: string;
  tableName: string;
  columns: CreateColumnItem[];
  sessionId?: string;
}

export interface CreateFormResult {
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
 * Fetches the object schema details for the NewPanel component.
 */
export async function showForm(
  payload: ShowFormPayload,
  endpoint: string = GET_OBJECT_SCHEMA_ENDPOINT
): Promise<ShowFormResult> {
  const tableName = payload?.tableName?.trim();

  if (!tableName) {
    return {
      success: false,
      error: "Missing required parameter 'tableName'.",
    };
  }

  try {
    const apiPayload: ShowFormPayload = { tableName, src: payload.src };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    const sessionToken = response.headers.get('X-Session-Token') || response.headers.get('x-session-token');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log("showForm > ", sessionToken);

    return {
      success: true,
      sessionToken: sessionToken || "",
      data,
    };

  } catch (err: any) {
    console.error('Error in showForm (NewPanel):', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch object schema',
    };
  }
}

/**
 * Submits new record fields back to the backend.
 */
export async function createForm(
  payload: CreateFormPayload,
  endpoint: string = CREATE_OBJECT_ENDPOINT
): Promise<CreateFormResult> {
  const tableName = payload?.tableName?.trim();

  if (!tableName) {
    return {
      success: false,
      error: "Missing required parameter 'tableName'.",
    };
  }

  try {
    const apiPayload = {
      tableName,
      columns: payload.columns || [],
      sessionId: payload.sessionId || '',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': `${payload.sessionToken}` || "",
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
    console.error('Error in createForm (NewPanel):', err);
    return {
      success: false,
      error: err?.message || 'Failed to create record',
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
    console.error('Error in getList (NewPanel):', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch column list options',
    };
  }
}

export default showForm;