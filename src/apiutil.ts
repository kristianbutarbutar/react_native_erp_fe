// apiutil.ts

// Configurable API Base URL & Endpoints
export const API_BASE_URL = 'http://localhost:3001';
export const GET_LIST_ENDPOINT = `${API_BASE_URL}/api/get-list`;
export const GET_OBJECT_SCHEMA_ENDPOINT = `${API_BASE_URL}/api/get-object-schema`;

export interface GetListPayload {
    groupid: string;
    [key: string]: any;
}

export interface GetObjectSchemaPayload {
    objectid: string;
    [key: string]: any;
}

/**
 * Fetches list data from the backend by posting a groupid payload.
 * @param payload - Object containing groupid e.g. { groupid: 'group_1' }
 * @param endpoint - Optional URI override to make the target URL dynamically configurable
 */
export const getList = async <T = any>(
    payload: GetListPayload,
    endpoint: string = GET_LIST_ENDPOINT
): Promise<T> => {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP status ${response.status}: ${errorText}`);
        }

        const data: T = await response.json();
        return data;
    } catch (error) {
        console.error('Error calling getList API:', error);
        throw error;
    }
};

/**
 * Fetches object schema details from the backend by posting an objectid payload.
 * @param payload - Object containing objectid e.g. { objectid: 'obj_123' }
 * @param endpoint - Optional URI override to make the target URL dynamically configurable
 */
export const getObjectSchema = async <T = any>(
    payload: GetObjectSchemaPayload,
    endpoint: string = GET_OBJECT_SCHEMA_ENDPOINT
): Promise<T> => {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP status ${response.status}: ${errorText}`);
        }

        const data: T = await response.json();
        return data;
    } catch (error) {
        console.error('Error calling getObjectSchema API:', error);
        throw error;
    }
};