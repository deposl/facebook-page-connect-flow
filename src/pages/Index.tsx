import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Loader2, Settings, User, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAppCredentials, getConnectedAccounts, updateConnectionStatus } from "@/utils/apiService";
import BrandProfileForm from "@/components/BrandProfileForm";
import PostingPreferencesForm from "@/components/PostingPreferencesForm";
import SocialPostsCalendar from "@/components/SocialPostsCalendar";
import AccessRestrictionCard from "@/components/AccessRestrictionCard";
import { useSellerPackage } from "@/hooks/useSellerPackage";
import { getUserId } from "@/utils/userIdManager";

interface ConnectedAccount {
  platform: string;
  account_id: string;
  account_name: string;
  status: number;
}

const Index = () => {
  const [userId, setUserId] = useState<string>("");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const { sellerPackage, permissions, loading: packageLoading } = useSellerPackage(userId);

  useEffect(() => {
    // Get user ID from URL params or global variable
    const userIdFromSource = getUserId();
    if (userIdFromSource) {
      setUserId(userIdFromSource);
    }
  }, []);

  useEffect(() => {
    if (userId && userId.trim() !== "") {
      fetchConnectedAccounts();
    }
  }, [userId]);

  const fetchConnectedAccounts = async () => {
    try {
      setLoading(prev => ({ ...prev, connectedAccounts: true }));
      const accounts = await getConnectedAccounts(parseInt(userId));
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("Failed to fetch connected accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load connected accounts.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, connectedAccounts: false }));
    }
  };

  const handleUserIdSubmit = () => {
    if (userId && userId.trim() !== "") {
      fetchConnectedAccounts();
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid User ID.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (platform: string, accountId: string) => {
    try {
      setLoading(prev => ({ ...prev, [platform]: true }));
      await updateConnectionStatus(parseInt(userId), platform, accountId);
      setConnectedAccounts(prev =>
        prev.map(account =>
          account.platform === platform && account.account_id === accountId
            ? { ...account, status: 0 }
            : account
        )
      );
      toast({
        title: "Account Disconnected",
        description: `Successfully disconnected ${platform} account.`,
      });
    } catch (error) {
      console.error("Failed to disconnect account:", error);
      toast({
        title: "Error",
        description: `Failed to disconnect ${platform} account.`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Social Media Management</h1>
          <p className="text-lg text-gray-600">Connect your social accounts and manage your content</p>
        </div>

        {/* User ID Input */}
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              User Configuration
            </CardTitle>
            <CardDescription>Enter your user ID to access social media features</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleUserIdSubmit} disabled={!userId.trim()}>
                Load Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {userId && userId.trim() !== "" && (
          <>
            {/* Access Control Check */}
            {packageLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading access permissions...</span>
                </CardContent>
              </Card>
            ) : !permissions.hasAccess ? (
              <AccessRestrictionCard planName={permissions.planName} />
            ) : (
              <>
                {/* First Row: Social Media Connections (1/3) + Brand Profile & Posting Preferences (2/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Social Media Connections - 1/3 width */}
                  <div className="lg:col-span-1">
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader className="bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Social Media Connections</CardTitle>
                          {loading.connectedAccounts && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <CardDescription>Manage your connected social media accounts</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {connectedAccounts.map(account => (
                            <div key={account.account_id} className="flex items-center justify-between p-3 rounded-md border border-gray-200">
                              <div className="flex items-center space-x-3">
                                {account.platform === 'facebook' ? (
                                  <Facebook className="w-5 h-5 text-blue-500" />
                                ) : account.platform === 'instagram' ? (
                                  <Instagram className="w-5 h-5 text-pink-500" />
                                ) : (
                                  <Settings className="w-5 h-5 text-gray-500" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{account.account_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                                  </p>
                                </div>
                              </div>
                              {account.status === 1 ? (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDisconnect(account.platform, account.account_id)}
                                    disabled={loading[account.platform]}
                                  >
                                    {loading[account.platform] ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Disconnecting...
                                      </>
                                    ) : (
                                      "Disconnect"
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <XCircle className="w-4 h-4 text-red-500" />
                                  <span className="text-xs text-red-500">Disconnected</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {connectedAccounts.length === 0 && !loading.connectedAccounts && (
                            <div className="text-center py-4 text-gray-500">
                              <Settings className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                              <p>No social media accounts connected</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Brand Profile and Posting Preferences - 2/3 width */}
                  <div className="lg:col-span-2 space-y-6">
                    <BrandProfileForm userId={userId} />
                    <PostingPreferencesForm userId={userId} maxPostingDays={permissions.maxPostingDays} />
                  </div>
                </div>

                {/* Second Row: Social Media Calendar - Full Width */}
                <div className="w-full">
                  <SocialPostsCalendar userId={userId} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
