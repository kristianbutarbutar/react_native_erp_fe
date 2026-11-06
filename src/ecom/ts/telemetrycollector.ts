import {createForm} from './../../panel/ts/NewPanel';

export interface TelemetryInput {
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone: string;
  language: string;
}

/**
 * Generates a deterministic, pseudo-unique device/browser key 
 * from stable telemetry attributes.
 */
function generateDeviceFingerprintKey(telemetry: TelemetryInput): string {
  // Extract and normalize only high-entropy, stable hardware/browser traits
  const stableComponents = [
    telemetry.platform || '',
    String(telemetry.hardwareConcurrency || 0),
    String(telemetry.deviceMemory || 0),
    String(telemetry.screen.width || 0),
    String(telemetry.screen.height || 0),
    String(telemetry.screen.colorDepth || 0),
    String(telemetry.screen.pixelRatio || 1),
    telemetry.timezone || '',
    telemetry.language || '',
    // Optional: Include a sanitized version of the browser engine from userAgent if needed
  ];

  // Concatenate components into a unified string pipeline
  return stableComponents.join('|');

  /*// Compute SHA-256 cryptographic hash
  return crypto
    .createHash('sha256')
    .update(rawString)
    .digest('hex');*/
}

// Example usage inside an Express/NestJS telemetry controller handler:
export function processTelemetryIngestion(payload: TelemetryInput) {
  const deviceKey = generateDeviceFingerprintKey(payload);
  
  const dbRecord = {
    device_id: deviceKey,
    user_agent: payload.userAgent,
    platform: payload.platform,
    hardware_concurrency: String(payload.hardwareConcurrency),
    device_memory: String(payload.deviceMemory ?? ''),
    screen_width: String(payload.screen.width),
    screen_height: String(payload.screen.height),
    timezone: payload.timezone,
  };
  return dbRecord;
}

export function populateTelemetryInput(): TelemetryInput {
  const nav = navigator as any;
  return {
    userAgent: nav.userAgent || 'unknown',
    platform: nav.platform || 'unknown',
    hardwareConcurrency: nav.hardwareConcurrency || 1,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    screen: {
      width: window.screen.width || 0,
      height: window.screen.height || 0,
      colorDepth: window.screen.colorDepth || 24,
      pixelRatio: window.devicePixelRatio || 1,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: nav.language || nav.userLanguage || 'en-US',
  };
}

export const collectTelemetry = async ( payload:{sessionToken:string, objectid:string, columns:[]}) => {
        
        const __telem:TelemetryInput = populateTelemetryInput();

        const __t_record = processTelemetryIngestion(__telem);

        const __colstransformed = transformJson ({columns:payload.columns, formdt:__t_record});

        await createForm({sessionToken:payload.sessionToken, objectid:payload.objectid, columns:__colstransformed, sessionId:payload.sessionToken});

}

// utils/transformJson.ts

export interface ColumnDetail {
  name?: string;
}

export interface ColumnRecord {
  id?: string;
  pid?: string;
  col?: ColumnDetail;
  col_name?: string;
  [key: string]: any;
}

export type FormDataInput = Record<string, any>[] | Record<string, any>;

export interface TransformJsonInput {
  columns: ColumnRecord[];
  formdt: FormDataInput;
}

export interface MappedColumnResponse {
  col_name: string;
  value: any;
}

/**
 * Transforms columns JSON and form data into a normalized response array 
 * whose length precisely matches columns.length.
 */
export function transformJson(input: TransformJsonInput): MappedColumnResponse[] {
  const { columns, formdt } = input;

  if (!Array.isArray(columns)) {
    throw new Error('[TransformError] columns must be a valid array.');
  }

  // 1. Build a case-insensitive lookup map, handling both array and single object inputs for formdt
  const attributeMap = new Map<string, any>();
  
  const recordsArray = Array.isArray(formdt) ? formdt : [formdt];

  for (const record of recordsArray) {
    if (record && typeof record === 'object') {
      // Handle explicit {"attributename": "...", "value": "..."} structures
      if ('attributename' in record && 'value' in record) {
        if (typeof record.attributename === 'string') {
          attributeMap.set(record.attributename.toLowerCase(), record.value);
        }
      } 
      
      // Handle standard flat key-value object records (e.g., { device_id: '...', user_agent: '...' })
      for (const [key, val] of Object.entries(record)) {
        if (key !== 'attributename' && key !== 'value') {
          attributeMap.set(key.toLowerCase(), val);
        } else if (key === 'value' && 'col_name' in record && typeof record.col_name === 'string') {
          attributeMap.set(record.col_name.toLowerCase(), record.value);
        }
      }
    }
  }

  // 2. Map strictly over columns to guarantee output length matches columns.length
  const response: MappedColumnResponse[] = columns.map((colItem) => {
    // Resolve column name supporting columns[i].col.name with fallback to col_name
    const resolvedColName = colItem?.col?.name || colItem?.col_name || '';
    const lowerColName = resolvedColName.toLowerCase();

    // Check criteria: columns[i].col.name.toLowerCase() === formdt attribute key.toLowerCase()
    if (attributeMap.has(lowerColName)) {
      const val = attributeMap.get(lowerColName);
      return {
        col_name: resolvedColName,
        value: val !== undefined && val !== null ? val : '',
      };
    }

    // When criteria does not match, response[].value is ""
    return {
      col_name: resolvedColName,
      value: '',
    };
  });

  return response;
}