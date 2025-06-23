
import { useState, useEffect } from 'react';
import { getSellerPackage, getPackagePermissions, SellerPackage } from '@/utils/sellerPackageService';

export const useSellerPackage = (userId: string) => {
  const [sellerPackage, setSellerPackage] = useState<SellerPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && userId.trim() !== "") {
      fetchSellerPackage();
    }
  }, [userId]);

  const fetchSellerPackage = async () => {
    try {
      setLoading(true);
      setError(null);
      const packageData = await getSellerPackage(parseInt(userId));
      setSellerPackage(packageData);
    } catch (err) {
      setError('Failed to load seller package information');
      console.error('Error fetching seller package:', err);
    } finally {
      setLoading(false);
    }
  };

  const permissions = sellerPackage 
    ? getPackagePermissions(sellerPackage.seller_package_id)
    : { hasAccess: false, maxPostingDays: 0, planName: 'Unknown Plan' };

  return {
    sellerPackage,
    permissions,
    loading,
    error,
    refetch: fetchSellerPackage
  };
};
