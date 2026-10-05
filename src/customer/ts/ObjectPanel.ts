// customer/ObjectPanel.ts

import { DOMAIN_WEB, DOMAIN_QONLY_WEB } from '../../global';

export const QUERY_OBJECT_ENDPOINT = `${DOMAIN_WEB()}/api/query-object`;
export const QUERY_TABS_ENDPOINT = `${DOMAIN_QONLY_WEB()}/api/query`;

export interface WhereClauseItem {
    col_name: string;
    value: any;
    type?: string;
    operator?: string;
}

export interface ColumnFilterItem {
    col_name: string;
    value: any;
    [key: string]: any;
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
    columns: ColumnFilterItem[];
    filterColumns: string[];
    recordid: string;
    sessionId?: string;
    [key: string]: any;
}

export interface GetTabsResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface GetParentTabPayload {
    objectid?: string;
    parenttabid: string;
    recordid: string;
    sessionId?: string;
    [key: string]: any;
}

export interface OpenChildrenTabsPayload {
    objectid?: string;
    parenttabid: string;
    recordid: string;
    sessionId?: string;
    level?: any;
    [key: string]: any;
}

export interface AddActionBoxPayload {
    newTabBoxName: string;
    tabLevel: any;
}

export interface DropActionBoxPayload {
    tabBoxName: string;
    tabLevel: any;
}

/**
 * Calls the API to fetch tabs dynamically based on custom request payloads.
 *
 * @param input - Object containing objectid, columns, filterColumns, and recordid.
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
            columns: input.columns || [],
            filterColumns: input.filterColumns || [],
            recordid: input.recordid,
            ...(input.sessionId ? { sessionId: input.sessionId } : {}),
        };
        console.log("getTabs > endpoint > ", endpoint);
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
        console.error('Error in getTabs (ObjectPanel):', err);
        return {
            success: false,
            error: err?.message || 'Failed to fetch tabs',
        };
    }
}

/**
 * Convenience wrapper function that builds the standard parent tab payload 
 * and delegates the API call to getTabs.
 *
 * @param input - Object containing objectid, parenttabid, and recordid.
 * @param endpoint - Configurable API endpoint URL.
 * @returns Promise resolving to the API response object from getTabs.
 */
export async function getParentTab(
    input: GetParentTabPayload,
    endpoint?: string
): Promise<GetTabsResult> {
    const tabsPayload: GetTabsPayload = {
        objectid: 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f',
        columns: [
            {
                col_name: 'id',
                value: input.recordid,
            },
        ],
        filterColumns: ['id', 'pid', 'label', 'level', 'target_tsx', 'formid', 'icon'],
        recordid: input.recordid,
        sessionId: input.sessionId,
    };

    return await getTabs(tabsPayload, endpoint);
}

/**
 * Dynamically creates and injects a new action box element under the primary Action box with matching dimensions.
 */
export function addActionBox({ newTabBoxName, tabLevel }: AddActionBoxPayload): HTMLElement | null {
    if (typeof document === 'undefined') return null;

    const safeBoxName = newTabBoxName || `action-box-${tabLevel}`;
    let dynamicBox = document.getElementById(safeBoxName);

    if (!dynamicBox) {
        dynamicBox = document.createElement('div');
        dynamicBox.id = safeBoxName;
        dynamicBox.className = 'dynamic-action-sub-box';
        dynamicBox.setAttribute('data-tab-level', String(tabLevel));

        // Style matching primary border box layout constraints
        dynamicBox.style.backgroundColor = '#FFFFFF';
        dynamicBox.style.borderWidth = '0.5px';
        dynamicBox.style.borderStyle = 'solid';
        dynamicBox.style.borderColor = '#0F172A';
        dynamicBox.style.borderRadius = '2px';
        dynamicBox.style.padding = '2px';
        dynamicBox.style.margin = '2px';
        dynamicBox.style.width = '100%';
        dynamicBox.style.maxWidth = '100%';
        dynamicBox.style.boxSizing = 'border-box';
        dynamicBox.style.minHeight = '22px';
        dynamicBox.style.display = 'flex';
        dynamicBox.style.flexDirection = 'row';
        dynamicBox.style.alignItems = 'center';
        dynamicBox.style.overflow = 'hidden';

        // Locate main action box or container to anchor the new sub-box beneath it
        const primaryActionBox = document.querySelector('.object-panel-action-box') || document.querySelector('.borderBox');
        if (primaryActionBox && primaryActionBox.parentNode) {
            primaryActionBox.parentNode.insertBefore(dynamicBox, primaryActionBox.nextSibling);
        } else {
            document.body.appendChild(dynamicBox);
        }
    }

    return dynamicBox;
}

/**
 * Drops/removes an existing dynamic action box by its unique identifier name and level.
 */
export function dropActionBox({ tabBoxName, tabLevel }: DropActionBoxPayload): void {
    if (typeof document === 'undefined') return;

    const safeBoxName = tabBoxName || `action-box-${tabLevel}`;
    const existingBox = document.getElementById(safeBoxName);
    if (existingBox && existingBox.parentNode) {
        existingBox.parentNode.removeChild(existingBox);
    }
}

/**
 * Opens children tabs by calling getTabs, cleaning up previous instances via dropActionBox, 
 * and generating new layout slots through addActionBox.
 */
export async function openChildrenTabs(
    input: OpenChildrenTabsPayload,
    endpoint?: string
): Promise<GetTabsResult> {
    const objectid = input.objectid || 'e11f7c82-419b-4e12-b94d-7a3b2c1d0e5f';
    const parenttabid = input.parenttabid;
    const recordid = input.recordid;
    const sessionId = input.sessionId;
    const level = input.level ?? 1;

    const boxName = `sub-action-box-level-${level}`;

    // 1. Invoke getTabs to retrieve contextual child configuration data
    const getTabsPayload: GetTabsPayload = {
        objectid,
        columns: [
            {
                col_name: 'pid',
                value: parenttabid,
            },
        ],
        filterColumns: ['id', 'pid', 'label', 'level', 'target_tsx', 'formid'],
        recordid,
        sessionId,
    };

    const tabsResult = await getTabs(getTabsPayload, endpoint);

    // 2. Drop existing action box layout for this level before rendering updated content
    dropActionBox({
        tabBoxName: boxName,
        tabLevel: level,
    });

    // 3. Add fresh dynamic action box container
    addActionBox({
        newTabBoxName: boxName,
        tabLevel: level,
    });

    return tabsResult;
}

export default getTabs;