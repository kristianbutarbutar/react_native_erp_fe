export interface ChatCallParams {
  action: string;
  uid: string;
  touid?: string[];
  message?: string;
  timestamp?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Calls the chat API endpoint to read or write messages.
 * 
 * @param params ChatCallParams containing action, uid, touid, optional message, and timestamp.
 * @param endpoint Optional custom endpoint URL, defaults to 'http://localhost:3333/api/chat'.
 * @returns Promise<ChatResponse>
 */
export async function callChat(
  params: ChatCallParams,
  endpoint: string = 'http://localhost:3003/api/chat'
): Promise<ChatResponse> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Failed to call chat API:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}