// panel/ts/DeletePanel.ts
import {DOMAIN_WEB} from '../../global';

export const DROP_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/drop`;//'http://localhost:3000/api/drop';

export interface DropObjectPayload {
    tableName: string;
    recordid: string;
    sessionid?: string;
}

export interface DropObjectResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Deletes an object record from the backend database.
 * Calls http://localhost:3000/api/drop-object (configurable).
 * Payload: { tableName: objectid, recordid: recordid, sessionid: '' }
 */
export async function dropObjectItem(
    payload: DropObjectPayload,
    endpoint: string = DROP_OBJECT_ENDPOINT
): Promise<DropObjectResult> {
    const tableName = payload?.tableName?.trim();
    const recordId = String(payload?.recordid || '').trim();

    if (!tableName || !recordId) {
        return {
            success: false,
            error: "Missing required parameters 'tableName' or 'recordid'.",
        };
    }

    try {
        const apiPayload = {
            tableName,
            columns:[{col_name:"id", value:recordId}],
            sessionid: payload.sessionid || '',
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
        console.error('Error in dropObjectItem:', err);
        return {
            success: false,
            error: err?.message || 'Failed to delete record.',
        };
    }
}

export default dropObjectItem;