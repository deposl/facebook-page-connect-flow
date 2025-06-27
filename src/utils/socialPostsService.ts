
interface SocialPost {
  id: number;
  user_id: number;
  product_id: number;
  product_name: string;
  caption: string;
  image: string;
  dayof: string;
  date: string;
  status: string;
  published_status: number;
  created_at: string;
  updated_at: string;
}

export const getSocialPosts = async (userId: number): Promise<SocialPost[]> => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/get-social-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch social posts: ${response.status}`);
    }

    const result = await response.json();
    console.log('Social posts response:', result);
    return result || [];
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return [];
  }
};

export type { SocialPost };
