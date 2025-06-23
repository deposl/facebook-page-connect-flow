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
  status?: number;
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
        platform: platform,
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

export const insertBrandProfile = async (data: {
  user_id: number;
  tone: string;
  voice: string;
  description: string;
}) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/insert-brand-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to insert brand profile: ${response.status}`);
    }

    const result = await response.json();
    console.log('Insert brand profile response:', result);
    return result;
  } catch (error) {
    console.error('Error inserting brand profile:', error);
    throw error;
  }
};

export const searchBrandProfile = async (userId: number) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/search-brand-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to search brand profile: ${response.status}`);
    }

    const result = await response.json();
    console.log('Search brand profile response:', result);
    return result;
  } catch (error) {
    console.error('Error searching brand profile:', error);
    throw error;
  }
};

export const updateBrandProfile = async (data: {
  user_id: number;
  tone: string;
  voice: string;
  description: string;
}) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/update-brand-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update brand profile: ${response.status}`);
    }

    const result = await response.json();
    console.log('Update brand profile response:', result);
    return result;
  } catch (error) {
    console.error('Error updating brand profile:', error);
    throw error;
  }
};

export const insertPostPreference = async (data: {
  user_id: number;
  posting_days: string;
  posting_time: string;
  manual_review: number;
  notification_days: string;
  consent: number;
}) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/insert-post-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to insert post preference: ${response.status}`);
    }

    const result = await response.json();
    console.log('Insert post preference response:', result);
    return result;
  } catch (error) {
    console.error('Error inserting post preference:', error);
    throw error;
  }
};

export const searchPostPreference = async (userId: number) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/search-post-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to search post preference: ${response.status}`);
    }

    const result = await response.json();
    console.log('Search post preference response:', result);
    return result;
  } catch (error) {
    console.error('Error searching post preference:', error);
    throw error;
  }
};

export const updatePostPreference = async (data: {
  user_id: number;
  posting_days: string;
  posting_time: string;
  manual_review: number;
  notification_days: string;
  consent: number;
}) => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/update-post-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update post preference: ${response.status}`);
    }

    const result = await response.json();
    console.log('Update post preference response:', result);
    return result;
  } catch (error) {
    console.error('Error updating post preference:', error);
    throw error;
  }
};
