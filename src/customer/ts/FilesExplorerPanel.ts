// src/customer/FileExplorerPanel.ts
import {DOMAIN_WEB} from '../../global';

const API_DOMAIN_WEB = DOMAIN_WEB(); 

export const QUERY_OBJECT_IN_TABLE_ENDPOINT = `${API_DOMAIN_WEB}/api/query-object-in-table`;

export interface LoadFilesPayload {
    sessionid?: string;
    filegroupid?: string | number;
    row_start?: number | string;
    row_end?: number | string;
    whereClause?: [];
    [key: string]: any;
}

export interface LoadFilesResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Loads files by querying table objects via POST request.
 *
 * @param input - Object containing sessionid, filegroupid, row_start, and row_end.
 * @param endpoint - Configurable API endpoint URL (defaults to http://localhost:3000/api/query-object-in-table).
 * @returns Promise resolving to the API response object.
 */
export async function loadFiles(
    input: LoadFilesPayload,
    endpoint: string = QUERY_OBJECT_IN_TABLE_ENDPOINT
): Promise<LoadFilesResult> {
    try {
        const sessionId = input.sessionid || '';
        const rowStart = input.row_start ?? 1;
        const rowEnd = input.row_end ?? 10;

        const requestPayload = {
            sessionid: sessionId,
            objectid: 'UPLOADED_FILES_FORM_ID',
            row_start: rowStart,
            row_end: rowEnd,
            whereClause: [{ col_name: "pid", value: input.filegroupid }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(sessionId ? { 'x-session-id': sessionId } : {}),
            },
            body: JSON.stringify(requestPayload),
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
        console.error('Error in loadFiles (FileExplorerPanel):', err);
        return {
            success: false,
            error: err?.message || 'Failed to load files',
        };
    }
}

export default loadFiles;