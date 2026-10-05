// panel/ts/Configuration.ts
import {DOMAIN_WEB,DOMAIN_QONLY_WEB} from '../../global';

export const QUERY_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/query-object`; //http://localhost:3000/api/query-object';
export const QUERY_TABS_ENDPOINT = `${DOMAIN_QONLY_WEB}/api/query`;//'http://localhost:3001/api/query';

export interface WhereClauseItem {
    col_name: string;
    value: any;
    type?: string;
    operator?: string;
}

export interface LoadTabsPayload {
    tableName: string;
    whereClause?: WhereClauseItem[];
    sessionId?: string;
    [key: string]: any;
}

export interface LoadTabsResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface GetTabsPayload {
    objectid: string;
    parenttabid: string;
    recordid: string;
}

export interface GetTabsResult {
    success: boolean;
    data?: any;
    error?: string;
}

const DEFAULT_LOAD_TABS_PAYLOAD: LoadTabsPayload = {
    tableName: '',
    whereClause: [
        { col_name: 'level', value: 1, type: 'INT', operator: '=' },
        { col_name: 'pid', value: 'ROOT', type: 'STRING', operator: '=' },
    ],
};

/**
 * Calls the API to load configuration tabs matching the provided payload query.
 *
 * @param payload - JSON input containing tableName and whereClause filters.
 * @param endpoint - Configurable API endpoint URL (defaults to http://localhost:3000/api/query-object).
 * @returns Promise resolving to the API response object.
 */
export async function loadTabs(
    payload: LoadTabsPayload = DEFAULT_LOAD_TABS_PAYLOAD,
    endpoint: string = QUERY_OBJECT_ENDPOINT
): Promise<LoadTabsResult> {
    try {
        const apiPayload: LoadTabsPayload = {
            tableName: payload?.tableName ?? DEFAULT_LOAD_TABS_PAYLOAD.tableName,
            whereClause: payload?.whereClause ?? DEFAULT_LOAD_TABS_PAYLOAD.whereClause,
            ...(payload?.sessionId ? { sessionId: payload.sessionId } : {}),
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
        console.error('Error in loadTabs (Configuration):', err);
        return {
            success: false,
            error: err?.message || 'Failed to load configuration tabs',
        };
    }
}

/**
 * Calls the API to fetch tabs dynamically based on parent tab ID and record ID.
 *
 * @param input - Object containing objectid, parenttabid, and recordid.
 * @param endpoint - Configurable API endpoint URL (defaults to http://localhost:3001/api/query).
 * @returns Promise resolving to the API response object.
 */
export async function getTabs(
    input: GetTabsPayload,
    endpoint: string = QUERY_TABS_ENDPOINT
): Promise<GetTabsResult> {
    try {
        const requestPayload = {
            objectid: input.objectid,
            columns: [
                {
                    col_name: 'pid',
                    value: input.parenttabid,
                },
            ],
            filterColumns: ['id', 'pid', 'label', 'level', 'target_tsx', 'formid', 'icon'],
            recordid: input.recordid,
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
        console.error('Error in getTabs (Configuration):', err);
        return {
            success: false,
            error: err?.message || 'Failed to fetch tabs',
        };
    }
}

export default loadTabs;