// panel/ts/Derado.ts
import {DOMAIN_WEB} from '../../global';

export const DROP_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/drop-object`;//'http://localhost:3000/api/drop-object';
export const DROP_ENDPOINT = `${DOMAIN_WEB()}/api/drop`;//'http://localhost:3000/api/drop';

export interface DropItemPayload {
    tableName: string;
    recordid: string;
    sessionid?: string;
    [key: string]: any;
}

export interface DropItemResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface DropColumnItem {
    col_name: string;
    col_type?: string;
    value: any;
    [key: string]: any;
}

export interface DropPayload {
    tableName: string;
    sessionid?: string;
    columns: DropColumnItem[];
    [key: string]: any;
}

export interface DropResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Sends a request to drop/delete an object record on the backend API using recordid.
 */
export async function dropItem(
    payload: DropItemPayload,
    endpoint: string = DROP_OBJECT_ENDPOINT
): Promise<DropItemResult> {
    const tableName = payload?.tableName?.trim();
    const recordid = payload?.recordid;

    if (!tableName) {
        return {
            success: false,
            error: "Missing required parameter 'tableName'.",
        };
    }

    if (!recordid) {
        return {
            success: false,
            error: "Missing required parameter 'recordid'.",
        };
    }

    try {
        const apiPayload = {
            tableName,
            recordid,
            sessionid: payload.sessionid || '',
        };

        console.log('Call API:', endpoint, 'Payload =>', JSON.stringify(apiPayload));

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
        console.error('Error in dropItem (Derado):', err);
        return {
            success: false,
            error: err?.message || 'Failed to drop item record',
        };
    }
}

/**
 * Sends a request to drop/delete object records based on table name and column conditions.
 * 
 * @param payload - Object containing tableName, sessionid, and columns array
 * @param endpoint - Configurable API endpoint (defaults to http://localhost:3000)
 * @returns Promise<DropResult> containing API response or error details
 */
export async function drop(
    payload: DropPayload,
    endpoint: string = DROP_ENDPOINT
): Promise<DropResult> {
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
            sessionid: payload.sessionid || '',
            columns: payload.columns,
        };

        console.log('Call API:', endpoint, 'Payload =>', JSON.stringify(apiPayload));

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
        console.error('Error in drop (Derado):', err);
        return {
            success: false,
            error: err?.message || 'Failed to drop record',
        };
    }
}

export default dropItem;