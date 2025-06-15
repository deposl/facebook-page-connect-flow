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

interface AppCredentials {
  id: number;
  app_id: string;
  app_secret: string;
  app_name: string;
  created_at: string;
  updated_at: string;
}

export const getAppCredentials = async (): Promise<AppCredentials> => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch app credentials: ${response.status}`);
    }

    const result = await response.json();
    console.log('App credentials response:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('No app credentials found');
    }

    return result[0]; // Return the first app credentials
  } catch (error) {
    console.error('Error fetching app credentials:', error);
    throw error;
  }
};

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

export const getConnectedAccounts = async (userId: number) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch connected accounts: ${response.status}`);
    }

    const result = await response.json();
    console.log('Connected accounts response:', result);
    return result || [];
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return [];
  }
};

export const updateConnectionStatus = async (userId: number, platform: string, accountId: string) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook-test/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({
        user_id: userId,
        platform: platform.toLowerCase(),
        account_id: accountId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update connection status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Status update response:', result);
    return result;
  } catch (error) {
    console.error('Error updating connection status:', error);
    throw error;
  }
};
