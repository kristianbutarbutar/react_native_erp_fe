// panel/ts/FormsChilds.ts

import { drop } from './Derado';
import {DOMAIN_WEB} from '../../global';

export const QUERY_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/query-object`; //'http://localhost:3000/api/query-object';
export const CREATE_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/save-object`; //'http://localhost:3000/api/save-object';

export interface CreateColumnItem {
    col_name: string;
    value: any;
}

export interface CreateFormPayload {
    tableName: string;
    columns: CreateColumnItem[];
    sessionId?: string;
}

export interface CreateFormResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ColumnItem {
    col_name: string;
    value: any;
    [key: string]: any;
}

export interface WhereClauseItem {
    col_name: string;
    value: any;
    type?: string;
    operator?: string;
}

export interface ShowFormsPayload {
    tableName: string;
    whereClause?: WhereClauseItem[];
    sessionId?: string;
    [key: string]: any;
}

export interface ShowFormsResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface FormChildInputItem {
    id?: string;
    pid: string;
    label: string;
    status: string;
    level: string | number;
    formid: string;
    seqno: number | string;
    [key: string]: any;
}

export interface SaveFormChildsPayload {
    tableName: string;
    recordid: string;
    children: FormChildInputItem[];
    sessionId?: string;
}

export interface SaveFormChildsResult {
    success: boolean;
    results?: any[];
    error?: string;
}

const DEFAULT_SHOW_FORMS_PAYLOAD: ShowFormsPayload = {
    tableName: 'VNBSHQXYCQFLYNQVCMXSGWNLGHGNAQEAYJIOVVQFOKGYXBAUDQ',
    whereClause: [
        { col_name: 'status', value: 'active', type: 'STRING', operator: '=' },
    ],
};

/**
 * Fetches forms based on table name and filter query criteria.
 */
export async function showForms(
    payload: ShowFormsPayload = DEFAULT_SHOW_FORMS_PAYLOAD,
    endpoint: string = QUERY_OBJECT_ENDPOINT
): Promise<ShowFormsResult> {
    try {
        const apiPayload: ShowFormsPayload = {
            tableName: payload?.tableName ?? DEFAULT_SHOW_FORMS_PAYLOAD.tableName,
            whereClause: payload?.whereClause ?? DEFAULT_SHOW_FORMS_PAYLOAD.whereClause,
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
        console.error('Error in showForms (FormsChilds):', err);
        return {
            success: false,
            error: err?.message || 'Failed to fetch forms',
        };
    }
}

/**
 * Drops existing child records for the selected parent form ID, then iterates over 
 * child form records, converts attribute key-values to ColumnItem definitions, 
 * and calls createForm for each child record.
 */
export async function saveFormChilds(
    payload: SaveFormChildsPayload
): Promise<SaveFormChildsResult> {
    try {
        const { tableName, recordid, children, sessionId = '' } = payload;

        if (!tableName) {
            throw new Error('tableName is required for saveFormChilds.');
        }

        if (!children || !Array.isArray(children) || children.length === 0) {
            throw new Error('No child records provided to save.');
        }

        // 1. Delete existing records for the parentid via drop (Derado)
        if (recordid) {
            try {
                console.log(`Attempting drop for parent pid: ${recordid}`);
                const dropResponse = await drop({
                    tableName: tableName,
                    sessionid: sessionId,
                    columns: [
                        {
                            col_name: 'pid',
                            col_type: 'STRING',
                            value: recordid,
                        },
                    ],
                });
                console.log('drop response:', dropResponse);
            } catch (dropErr: any) {
                console.warn('drop failed, continuing to save children:', dropErr);
            }
        }

        const creationResults: any[] = [];

        // 2. Iterate and create each child record
        for (let i = 0; i < children.length; i++) {
            const childItem = children[i];

            // Convert child attribute keys/values to [{ col_name: key, value: val }]
            const columns: ColumnItem[] = Object.keys(childItem).map((key) => ({
                col_name: key,
                value: childItem[key],
            }));

            // Invoke createForm for mapped child record
            const createFormPayload: CreateFormPayload = {
                tableName: tableName,
                columns: columns,
                sessionId: sessionId,
            };
            console.log('createFormPayload =>', i, JSON.stringify(createFormPayload));
            const result = await createForm(createFormPayload);

            if (!result.success) {
                throw new Error(
                    `Failed to create record at index ${i} (${childItem.label || 'unnamed'}): ${result.error || 'Unknown error'
                    }`
                );
            }

            creationResults.push(result.data);
        }

        return {
            success: true,
            results: creationResults,
        };
    } catch (err: any) {
        console.error('Error in saveFormChilds:', err);
        return {
            success: false,
            error: err?.message || 'Failed to save form child records.',
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
        console.log('call API ', CREATE_OBJECT_ENDPOINT, 'Payload => ', JSON.stringify(apiPayload));
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
        console.error('Error in createForm (NewPanel):', err);
        return {
            success: false,
            error: err?.message || 'Failed to create record',
        };
    }
}

export default showForms;