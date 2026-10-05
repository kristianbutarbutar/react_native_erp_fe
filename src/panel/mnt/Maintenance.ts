import {DOMAIN_WEB} from '../../global';

export interface DropMenuPayload {
  objectid: string;
  selectedmenuid: string;
  sessionid: string;
}

export interface DropMenuResponse {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

const API_BASE_URL = DOMAIN_WEB(); //'http://localhost:3000'; //process.env.NEXT_PUBLIC_API_URL || 

export async function dropMenu(input: DropMenuPayload): Promise<DropMenuResponse> {
  try {
    const payload = {
      tableName: input.objectid,
      recordid: input.selectedmenuid,
      sessionid: input.sessionid,
      columns:[{col_name:'id', value:input.selectedmenuid}],
      children:[{tableName:input.objectid, columns:[{col_name:'pid', value:input.selectedmenuid}]}],
    };

    const response = await fetch(`${API_BASE_URL}/api/drop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error in dropMenu API call:', error);
    return {
      success: false,
      error: error?.message || 'Network error while attempting to drop object.',
    };
  }
}