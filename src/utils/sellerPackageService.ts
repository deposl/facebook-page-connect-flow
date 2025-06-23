
export interface SellerPackage {
  user_id: number;
  seller_package_id: number;
}

export const getSellerPackage = async (userId: number): Promise<SellerPackage | null> => {
  try {
    const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/seller-package', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth': 'Manoj'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch seller package: ${response.status}`);
    }

    const result = await response.json();
    console.log('Seller package response:', result);
    
    if (result && Array.isArray(result) && result.length > 0) {
      // Find the package for the current user
      const userPackage = result.find((pkg: SellerPackage) => pkg.user_id === userId);
      return userPackage || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching seller package:', error);
    return null;
  }
};

export const getPackagePermissions = (packageId: number) => {
  switch (packageId) {
    case 4:
      return {
        hasAccess: false,
        maxPostingDays: 0,
        planName: 'Restricted Plan'
      };
    case 7:
      return {
        hasAccess: true,
        maxPostingDays: 3,
        planName: 'Starter Plan'
      };
    case 8:
    case 9:
      return {
        hasAccess: true,
        maxPostingDays: 7,
        planName: 'Advanced Plan'
      };
    default:
      return {
        hasAccess: false,
        maxPostingDays: 0,
        planName: 'Unknown Plan'
      };
  }
};
