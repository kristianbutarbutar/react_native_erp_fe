// customer/ts/CustomerPortal.ts

import { fetchHtmlStream } from './../panel/ts/HtmlPanel';

// Define the input parameter type for loadMenu
export interface LoadMenuParams {
  objectid: string;
  whereClause: Array<{ col_name: string; value: string }>;
  filterColumns: Array<string>;
  sessionid?: string;
}

export interface ShowHtmlParams {
  record?: Record<string, any>;
  sessionId?: string;
  [key: string]: any;
}

const DOMAIN_QUERY_OBJECT_ENDPOINT = '/api/query-object';

/**
 * Loads the menu by calling the configurable query-object API.
 * 
 * @param params Object containing objectid, whereClause, filterColumns, and optional sessionid
 * @param sessionid Optional session ID for authorization
 * @param endpoint Configurable API endpoint (defaults to /api/query-object)
 * @returns The JSON response from the API
 */
export const loadMenu = async (
  params: LoadMenuParams,
  sessionid?: string,
  endpoint: string = DOMAIN_QUERY_OBJECT_ENDPOINT,
) => {
  try {
    const activeSessionId = sessionid || params.sessionid;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeSessionId ? { 'Authorization': `Bearer ${activeSessionId}` } : {}),
      },
      body: JSON.stringify({
        objectid: params.objectid,
        whereClause: params.whereClause,
        filterColumns: params.filterColumns,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in loadMenu:', error);
    throw error;
  }
};

/**
 * Fetches HTML stream content by calling fetchHtmlStream from HtmlPanel.ts.
 * 
 * @param params Object containing record and sessionId
 * @returns Promise resolving to the HTML file stream content.
 */
export async function showHtml(params: ShowHtmlParams): Promise<string | null> {
  try {
    const htmlStream = await fetchHtmlStream(params);
    return htmlStream;
  } catch (error) {
    console.error('Error in showHtml:', error);
    return null;
  }
}