// src/ts/GlobalChat.ts

// Define the input parameter type for loadMenu
export interface LoadMenuParams {
  objectid: string;
  columns: Array<{ col_name: string; value: string }>;
  sessionid?: string;
}

export interface ShowHtmlParams {
  record?: Record<string, any>;
  sessionId?: string;
  [key: string]: any;
}
const DOMAIN_Q_OBJECT_ENDPOINT = '/api/query-object';
const DOMAIN_REG_OBJECT_ENDPOINT = '/api/save-object';
const DOMAIN_COLUMNS_ENDPOINT = '/api/get-object-schema';

/**
 * Loads the menu by calling the configurable query-object API.
 */
export const saveObject = async (
  params: LoadMenuParams,
  sessionid?: string,
  endpoint: string = DOMAIN_REG_OBJECT_ENDPOINT,
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
        columns: params.columns
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in saveObject:', error);
    throw error;
  }
};

export const __QC = async (
  params: { objectid: string, sessionid: string },
  sessionid?: string,
  endpoint: string = DOMAIN_COLUMNS_ENDPOINT,
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
        objectid: params.objectid
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in __QC:', error);
    throw error;
  }
};

export const qObject = async (
  params: {objectid:string, sessionid:string, whereClause:any, filterColumns:any},
  sessionid?: string,
  endpoint: string = DOMAIN_Q_OBJECT_ENDPOINT,
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
        filterColumns: params.filterColumns
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in qObject:', error);
    throw error;
  }
};


/**
 * Registers a guest by first fetching schema columns and saving the guest record,
 * returning the resolved UID only after the API response is fully confirmed.
 */
export const registerGuest = async (
  params: { uid: string, sessionid: string, touid:string }
): Promise<string> => {
  try {
    // 1. Fetch schema columns for the portal user form
    const __cols = await __QC({ objectid: "PORTAL_USER_FORM_ID", sessionid: params.sessionid });
    let _forms:any = [];

    if (__cols && __cols.columns) {
        __cols.columns.map((record:any) => {
            _forms.push({col_name:record.col_name, value:(record.col_name.toLowerCase() === 'uid' ? params.uid : (record.col_name.toLowerCase() === 'pid' ? params.touid: "" ))});
        });
        console.log("_forms > ", JSON.stringify(_forms));
    }

    // 2. Perform the save object API call to persist the guest and wait for the response
    const saveResult = await saveObject({
      objectid: "PORTAL_USER_FORM_ID",
      sessionid: params.sessionid,
      columns: _forms
    });

    console.log("registerGuest > saveResult > ", JSON.stringify(saveResult));

    const res = await qObject({ objectid: "PORTAL_USER_FORM_ID", sessionid:params.sessionid, whereClause:[{col_name:"uid",value:params.uid}], filterColumns:["id"]});

    console.log("_forms > res.id >", res.data[0].id);

    // 3. Return the registered uid only after the response is fully received
    return res.data[0].id || "";
  } catch (error) {
    console.error('Error in registerGuest:', error);
    throw error;
  }
};