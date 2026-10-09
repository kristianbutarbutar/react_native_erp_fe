// customer/ObjectFile.ts

import {DOMAIN_UPLOAD_WEB} from '../../global';

const API_DOMAIN_UPLOAD = DOMAIN_UPLOAD_WEB(); 

export const QUERY_UPLOAD_ENDPOINT = `${API_DOMAIN_UPLOAD}/api/upload`;

export interface FileItem {
    name: string;
    type: string;
    uri?: string;
    originFile?: File;
    [key: string]: any;
}

export interface DoUploadPayload {
    files: FileItem[];
    sessionId?: string;
    [key: string]: any;
    htmleditor?: string;
    recordid?: string;
}

export interface DoUploadResult {
    success: boolean;
    data?: any;
    error?: string;
    id?: any;
}

/**
 * Converts a given file item (Web File or React Native local file/URI) into a Base64 string.
 */
async function convertToBase64(file: FileItem): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // If native Web File object is present (from input type="file")
            if (file.originFile && file.originFile instanceof File) {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Strip base64 prefix if present (e.g., "data:image/jpeg;base64,")
                    const base64Data = result.includes(',') ? result.split(',')[1] : result;
                    resolve(base64Data);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file.originFile);
                return;
            }

            // If a uri is available (React Native environment), fetch blob and convert to Base64
            if (file.uri) {
                fetch(file.uri)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result as string;
                            const base64Data = result.includes(',') ? result.split(',')[1] : result;
                            resolve(base64Data);
                        };
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(blob);
                    })
                    .catch((err) => reject(err));
                return;
            }

            resolve('');
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Uploads an array of files by converting each into Base64 and sending a JSON payload via POST.
 *
 * @param input - Object containing files array and sessionid.
 * @param endpoint - Configurable API endpoint URL (defaults to http://localhost:3002/api/upload).
 * @returns Promise resolving to the API response object.
 */
export async function doUpload(
    input: DoUploadPayload,
    endpoint: string = QUERY_UPLOAD_ENDPOINT
): Promise<DoUploadResult> {
    try {
        const sessionId = input.sessionId || input.sessionid || '';
        const rawFiles = input.files || [];
        const inputHtmlEditor = input.htmleditor || '';
        const recordid = input.recordid || '';

        const formattedFiles = [];
        for (const file of rawFiles) {
            const base64Data = await convertToBase64(file);
            //console.log("File > ", file, ", base64Data > ", base64Data);
            formattedFiles.push({
                filename: file.name || 'uploaded_file',
                mimetype: file.type || 'application/octet-stream',
                fileData: base64Data,
            });
        }

        const requestPayload = {
            sessionid: sessionId,
            message: '',
            files: formattedFiles, htmleditor: inputHtmlEditor, recordid: recordid,
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
        return {
            success: false,
            error: err?.message || 'Failed to upload files',
        };
    }
}

export default doUpload;