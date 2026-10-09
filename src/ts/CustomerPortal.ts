import {DOMAIN_WEB} from '../global';

// Define the input parameter type for loadMenu
export interface LoadMenuParams {
  objectid: string;
  domain: string;
  sessionid: string;
}
const DOMAIN_QUERY_OBJECT_ENDPOINT = `${DOMAIN_WEB}/api/query-object`;
/**
 * Loads the menu by calling the configurable query-object API.
 * 
 * @param params - Object containing objectid and domain
 * @param sessionid - Optional session ID for authorization
 * @param apiUrl - Configurable API endpoint (defaults to http://localhost:3000/api/query-object)
 * @returns The JSON response from the API
 */
export const loadMenu = async (
  params: LoadMenuParams,
  sessionid?: string,
  apiUrl: string = DOMAIN_QUERY_OBJECT_ENDPOINT,
) => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionid ? { 'Authorization': `Bearer ${sessionid}` } : {}),
      },
      body: JSON.stringify({
        objectid: params.objectid,
        whereClause: [
          {
            col_name: 'domain',
            value: params.domain,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in loadMenu:', error);
    throw error;
  }
};