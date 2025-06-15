
interface ApiData {
  user_id: number;
  platform: string;
  account_id: string;
  account_name: string;
  username?: string;
  access_token: string;
  long_lived_token: string;
  expires_in: string;
  connected_at: string;
  app_id: string;
}

export const saveConnectionData = async (data: ApiData) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook-test/insert-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('Error saving connection data:', error);
    throw error;
  }
};
