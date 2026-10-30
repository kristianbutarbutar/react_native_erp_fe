import { showForm } from './../../apiService'; // Adjust path if necessary
import { createForm } from './../../panel/ts/NewPanel'; // Adjust path if necessary

  /**
 * Safely parses and formats any price input (string, number, null) into a localized IDR string.
 */
  export const formatIDRCurrency = (val: any): string => {
    if (val === undefined || val === null || val === '') {
      return 'IDR 0';
    }

    // If it's already a clean number
    if (typeof val === 'number') {
      return `IDR ${val.toLocaleString('id-ID')}`;
    }

    // If it's a string containing currency symbols or separators (e.g., "IDR 150.000,00" or "$150.00")
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const numericValue = parseFloat(cleaned);

    if (isNaN(numericValue)) {
      return 'IDR 0';
    }

    return `IDR ${numericValue.toLocaleString('id-ID')}`;
  };

export interface ScreenAttribute {
    col_name: string;
    value: any;
    [key: string]: any;
}

export interface SavePublicDataInput {
    objectid: string;
    screenAttributes: ScreenAttribute[];
}

export interface GetCookiesInput {
    attribute: string[];
}

/**
 * Custom centered professional modal dialog for web environments.
 */
const showCustomModal = ({
    title,
    message,
    showCancel = false,
    confirmText = 'Accept',
    cancelText = 'Decline',
}: {
    title: string;
    message: string;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
}): Promise<boolean> => {
    return new Promise((resolve) => {
        if (typeof document === 'undefined') {
            resolve(false);
            return;
        }

        // Overlay backdrop
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';
        overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        // Modal Box
        const modal = document.createElement('div');
        modal.style.backgroundColor = '#FFFFFF';
        modal.style.borderRadius = '12px';
        modal.style.padding = '24px';
        modal.style.width = '100%';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        modal.style.textAlign = 'center';
        modal.style.boxSizing = 'border-box';

        // Title
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.margin = '0 0 10px 0';
        titleEl.style.fontSize = '18px';
        titleEl.style.fontWeight = '700';
        titleEl.style.color = '#0F172A';

        // Message
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.margin = '0 0 24px 0';
        messageEl.style.fontSize = '14px';
        messageEl.style.lineHeight = '1.5';
        messageEl.style.color = '#475569';

        // Buttons Wrapper
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '12px';
        btnGroup.style.justifyContent = 'center';

        const cleanup = () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };

        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = cancelText;
            cancelBtn.style.flex = '1';
            cancelBtn.style.padding = '10px 16px';
            cancelBtn.style.border = '1px solid #CBD5E1';
            cancelBtn.style.backgroundColor = '#F8FAFC';
            cancelBtn.style.color = '#334155';
            cancelBtn.style.borderRadius = '6px';
            cancelBtn.style.fontSize = '14px';
            cancelBtn.style.fontWeight = '600';
            cancelBtn.style.cursor = 'pointer';

            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };
            btnGroup.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = confirmText;
        confirmBtn.style.flex = '1';
        confirmBtn.style.padding = '10px 16px';
        confirmBtn.style.border = 'none';
        confirmBtn.style.backgroundColor = '#0F172A';
        confirmBtn.style.color = '#FFFFFF';
        confirmBtn.style.borderRadius = '6px';
        confirmBtn.style.fontSize = '14px';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.style.cursor = 'pointer';

        confirmBtn.onclick = () => {
            cleanup();
            resolve(true);
        };

        btnGroup.appendChild(confirmBtn);

        modal.appendChild(titleEl);
        modal.appendChild(messageEl);
        modal.appendChild(btnGroup);
        overlay.appendChild(modal);

        document.body.appendChild(overlay);
    });
};

/**
 * Retrieves specified cookie values from the browser.
 *
 * @param input Object containing array of cookie attribute names
 * @returns Key-value object mapping attribute name to its cookie value (or null if not found)
 */
export const getCookies = (input: GetCookiesInput): Record<string, string | null> => {
    const result: Record<string, string | null> = {};

    if (typeof document === 'undefined' || !document.cookie) {
        if (Array.isArray(input?.attribute)) {
            input.attribute.forEach((attr) => {
                result[attr] = null;
            });
        }
        return result;
    }

    // Parse current document cookies into key-value pairs
    const parsedCookies: Record<string, string> = {};
    const cookiePairs = document.cookie.split(';');

    for (const pair of cookiePairs) {
        const [key, ...valParts] = pair.trim().split('=');
        if (key) {
            parsedCookies[key.trim()] = decodeURIComponent(valParts.join('='));
        }
    }

    // Extract requested cookie attributes
    const attributesToFetch = Array.isArray(input?.attribute) ? input.attribute : [];

    for (const attr of attributesToFetch) {
        result[attr] = parsedCookies[attr] !== undefined ? parsedCookies[attr] : null;
    }

    return result;
};

/**
 * Retrieves or generates a unique device identifier.
 */
export const clientInfo = (): string => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const STORAGE_KEY = 'app_unique_device_id';
        let deviceId = localStorage.getItem(STORAGE_KEY);

        if (!deviceId) {
            deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11);

            localStorage.setItem(STORAGE_KEY, deviceId);
        }

        return deviceId;
    }

    const g = globalThis as any;

    if (typeof g.process !== 'undefined' && g.process.versions && g.process.versions.node) {
        try {
            const req = g.require || (typeof require !== 'undefined' ? require : null);

            if (req) {
                const os = req('os');
                const networkInterfaces = os.networkInterfaces();
                let macAddress = '';

                for (const interfaceName of Object.keys(networkInterfaces)) {
                    const interfaces = networkInterfaces[interfaceName];
                    if (interfaces) {
                        for (const net of interfaces) {
                            if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
                                macAddress = net.mac;
                                break;
                            }
                        }
                    }
                    if (macAddress) break;
                }

                const hostname = os.hostname();
                return `server-${hostname}-${macAddress || 'unknown'}`;
            }
        } catch (e) {
            return `server-unknown-${Date.now().toString(36)}`;
        }
    }

    return 'unknown-device';
};

/**
 * Prompts the user for consent with a professional centered modal and stores the device ID into a "public-client" cookie.
 * 
 * @param daysToExpire Number of days before cookie expires (default: 365)
 * @returns {Promise<boolean>} True if cookie was set upon consent, false otherwise
 */
export const loadCookies = async (daysToExpire: number = 365): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    const hasConsent = await showCustomModal({
        title: 'Cookie Consent',
        message: 'We use cookies to identify your device and improve your experience. Do you accept storing your device identifier in cookies?',
        showCancel: true,
        confirmText: 'Accept',
        cancelText: 'Decline',
    });

    if (hasConsent) {
        const deviceId = clientInfo();
        const date = new Date();
        date.setTime(date.getTime() + daysToExpire * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;

        document.cookie = `public-client=${encodeURIComponent(deviceId)}; ${expires}; path=/; SameSite=Lax`;
        
        return true;

    } else {
        await showCustomModal({
            title: 'Notice',
            message: 'Cookie consent was declined.',
            showCancel: false,
            confirmText: 'OK',
        });
        return false;
    }
};

/**
 * Saves public data by fetching form metadata via showForm and submitting via createForm.
 */
export const savePublicData = async (input: SavePublicDataInput): Promise<any> => {
    try {
        const trimmedTableName = input.objectid ? input.objectid.trim() : '';

        const result = await showForm({
            objectid: trimmedTableName,
            src: 'https://amgreat.id',
        });

        const sessionToken = result?.sessionToken ? result.sessionToken : '';

        const columnsList: any[] = result?.columns || [];
        const screenAttributesList = input.screenAttributes || [];

        const __form = columnsList.map((col: any) => {
            const colName = col.col_name;

            const matchedAttr = screenAttributesList.find(
                (attr) => attr.col_name === colName
            );

            return {
                col_name: colName,
                value: matchedAttr !== undefined ? matchedAttr.value : null,
            };
        });

        const response = await createForm({
            tableName: input.objectid,
            sessionToken,
            columns: __form,
        });

        return response;
    } catch (error) {
        console.error('[public.ts] Error saving public data:', error);
        throw error;
    }
};

/**
 * Enterprise Currency Sanitization Utility
 * Principal Systems Architecture - Production-Grade TypeScript Module
 */

export class CurrencySanitizer {
  /**
     * Excludes 'IDR' currency tokens from a given text string.
     * Handles case insensitivity, surrounding whitespace, and punctuation.
     * 
     * @param input - The raw text string containing currency symbols.
     * @returns The sanitized string with 'IDR' removed and whitespace normalized.
     */
  public static excludeIDR(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Regex breakdown:
    // \bIDR\b : Matches 'IDR' as a whole word (case-insensitive via 'i' flag)
    // \s*     : Matches any adjacent whitespace to prevent leaving double spaces behind
    const currencyRegex = /\bIDR\b\s*/gi;

    // Perform replacement and normalize any resulting multiple spaces
    return input
      .replace(currencyRegex, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
}

/**
 * Enterprise Financial String Division Utility
 * Principal Systems Architecture - Production-Grade TypeScript Module
 */

export class FinancialCalculator {
  /**
   * Divides a localized formatted number string by a divisor.
   * 
   * @param formattedString - e.g., "600.000.000"
   * @param divisor - e.g., 3
   * @returns The resulting formatted string (e.g., "200.000.000")
   */
  public static divideLocalizedNumber(formattedString: string, divisor: number = 3): number {
    if (!formattedString || typeof formattedString !== 'string') {
      return 0;
    }

    if (divisor === 0) {
      throw new Error('Arithmetic division by zero is prohibited.');
    }

    // Step 1: Remove all dots (thousands separators) and trim whitespace
    const cleanNumericStr = formattedString.replace(/\./g, '').trim();

    // Step 2: Parse into a number (use BigInt if values exceed Number.MAX_SAFE_INTEGER)
    const numericValue = parseFloat(cleanNumericStr);

    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric string provided for calculation: "${formattedString}"`);
    }

    // Step 3: Execute arithmetic division
    const resultValue = numericValue / divisor;

    // Step 4: Format back to Indonesian locale currency format ("id-ID")
    return resultValue;//.toLocaleString('id-ID');
  }
}