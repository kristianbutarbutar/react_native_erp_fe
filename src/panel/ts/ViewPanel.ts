// panel/ts/ViewPanel.ts

export const GET_OBJECT_SCHEMA_ENDPOINT = 'http://localhost:3001/api/get-object-schema';
export const VIEW_OBJECT_ITEM_ENDPOINT = 'http://localhost:3000/api/query-object';

export interface ViewPanelPayload {
  tableName: string;
}

export interface ViewPanelResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface WhereClauseItem {
  col_name: string;
  value: any;
  operator?: string;
}

export interface ViewObjectItemPayload {
  tableName?: string;
  objectid?: string;
  sessionId?: string;
  whereClause: WhereClauseItem[];
}

export interface ViewObjectItemResult {
  success: boolean;
  data?: any;
  objectLabel?: string;
  view?: any;
  error?: string;
}

/**
 * Fetches the object schema details for the ViewPanel component.
 */
export async function showForm(
  payload: ViewPanelPayload,
  endpoint: string = GET_OBJECT_SCHEMA_ENDPOINT
): Promise<ViewPanelResult> {
  const tableName = payload?.tableName?.trim();

  if (!tableName) {
    return {
      success: false,
      error: "Missing required parameter 'tableName'.",
    };
  }

  try {
    const apiPayload: ViewPanelPayload = { tableName };

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
    console.error('Error in showForm (ViewPanel):', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch object schema',
    };
  }
}

/**
 * Fetches specific record details using a table name and where clause filters.
 */
export async function viewObjectItem(
  payload: ViewObjectItemPayload,
  endpoint: string = VIEW_OBJECT_ITEM_ENDPOINT
): Promise<ViewObjectItemResult> {
  const tableName = payload?.tableName?.trim() || payload?.objectid?.trim();

  if (!tableName) {
    return {
      success: false,
      error: "Missing required parameter 'ObjectId'.",
    };
  }

  try {
    const apiPayload: ViewObjectItemPayload = {
      tableName,
      sessionId: payload.sessionId || '',
      whereClause: payload.whereClause || [],
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
    console.error('Error in viewObjectItem (ViewPanel):', err);
    return {
      success: false,
      error: err?.message || 'Failed to fetch item record details',
    };
  }
}

export default showForm;