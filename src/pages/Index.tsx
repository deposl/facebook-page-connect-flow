import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, Loader2, CheckCircle, X, Settings, Zap } from "lucide-react";
import { getAppCredentials, getConnectedAccounts, updateConnectionStatus } from "@/utils/apiService";
import { useSellerPackage } from "@/hooks/useSellerPackage";
import BrandProfileForm from "@/components/BrandProfileForm";
import PostingPreferencesForm from "@/components/PostingPreferencesForm";
import AccessRestrictionCard from "@/components/AccessRestrictionCard";

interface ConnectedAccount {
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

const Index = () => {
  const [appCredentials, setAppCredentials] = useState<{app_id: string, app_secret: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("11");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [checkingConnections, setCheckingConnections] = useState(false);
  const { toast } = useToast();
  const { sellerPackage, permissions, loading: packageLoading } = useSellerPackage(userId);

  useEffect(() => {
    // Get user_id from URL query params, default to 11 for testing
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user_id');
    if (userIdParam) {
      setUserId(userIdParam);
    }

    // Fetch app credentials on component mount
    fetchAppCredentials();
  }, []);

  // Check connected accounts whenever userId changes
  useEffect(() => {
    if (userId && userId.trim() !== "" && !loading) {
      checkConnectedAccounts(userId);
    }
  }, [userId, loading]);

  const fetchAppCredentials = async () => {
    try {
      setLoading(true);
      const credentials = await getAppCredentials();
      setAppCredentials({
        app_id: credentials.app_id,
        app_secret: credentials.app_secret
      });
      
      // Store credentials in localStorage for the OAuth callbacks
      localStorage.setItem("fb_app_id", credentials.app_id);
      localStorage.setItem("fb_app_secret", credentials.app_secret);
      localStorage.setItem("user_id", userId);
      
      toast({
        title: "App Credentials Loaded",
        description: `Successfully loaded ${credentials.app_name} credentials`,
      });
    } catch (error) {
      console.error("Failed to fetch app credentials:", error);
      toast({
        title: "Failed to Load Credentials",
        description: "Could not fetch Facebook app credentials from API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectedAccounts = async (userIdToCheck: string) => {
    try {
      setCheckingConnections(true);
      const accounts = await getConnectedAccounts(parseInt(userIdToCheck));
      setConnectedAccounts(accounts);
      console.log("Connected accounts:", accounts);
    } catch (error) {
      console.error("Failed to check connected accounts:", error);
    } finally {
      setCheckingConnections(false);
    }
  };

  const handleUserIdChange = (newUserId: string) => {
    setUserId(newUserId);
    localStorage.setItem("user_id", newUserId);
    // The useEffect will automatically trigger checkConnectedAccounts
  };

  const handleDisconnect = async (platform: string) => {
    try {
      // Get the connected account for this platform
      const connectedAccount = getConnectedAccount(platform);
      
      if (connectedAccount) {
        // Call the status API to disconnect
        await updateConnectionStatus(
          parseInt(userId), 
          platform, 
          connectedAccount.account_id
        );
        
        console.log(`Successfully disconnected ${platform} account via API`);
      }

      // Clear localStorage for the platform
      if (platform === 'facebook') {
        localStorage.removeItem("fb_page_access_token");
        localStorage.removeItem("fb_page_long_lived_token");
        localStorage.removeItem("fb_page_id");
        localStorage.removeItem("fb_page_name");
        localStorage.removeItem("fb_api_data");
      } else if (platform === 'instagram') {
        localStorage.removeItem("ig_access_token");
        localStorage.removeItem("ig_long_lived_token");
        localStorage.removeItem("ig_account_id");
        localStorage.removeItem("ig_account_name");
        localStorage.removeItem("ig_username");
        localStorage.removeItem("ig_api_data");
      }

      // Refresh connected accounts
      await checkConnectedAccounts(userId);
      
      toast({
        title: "Disconnected",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} account disconnected successfully`,
      });
    } catch (error) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast({
        title: "Error",
        description: `Failed to disconnect ${platform} account`,
        variant: "destructive",
      });
    }
  };

  const isConnected = (platform: string) => {
    const account = connectedAccounts.find(account => account.platform === platform);
    return account && account.status === 1;
  };

  const getConnectedAccount = (platform: string) => {
    return connectedAccounts.find(account => account.platform === platform);
  };

  const initiateOAuth = (platform: 'facebook' | 'instagram') => {
    if (!appCredentials) {
      toast({
        title: "Credentials Not Loaded",
        description: "Please wait for app credentials to load",
        variant: "destructive",
      });
      return;
    }

    // Update user_id in localStorage before OAuth
    localStorage.setItem("user_id", userId);

    // Generate a random state for CSRF protection with platform-specific key
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(`${platform}_oauth_state`, state);

    const redirectUri = `${window.location.origin}/oauth-callback/${platform}`;
    
    // Different scopes for Facebook vs Instagram
    const scope = platform === 'facebook' 
      ? "pages_show_list,pages_manage_posts,pages_read_engagement"
      : "instagram_basic,pages_show_list";
    
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appCredentials.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
    
    window.location.href = oauthUrl;
  };

  if (loading || packageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3 text-blue-600" />
            <span className="text-lg">Loading credentials...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600 text-center">Failed to Load Credentials</CardTitle>
            <CardDescription className="text-center">
              Could not fetch Facebook app credentials from the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAppCredentials} className="w-full" size="lg">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!permissions.hasAccess) {
    return <AccessRestrictionCard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Manager</h1>
              <p className="text-gray-600">Connect and manage your social media accounts</p>
              {sellerPackage && (
                <p className="text-sm text-blue-600 mt-1">
                  Current Plan: {permissions.planName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - User Config & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Configuration */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  User Configuration
                </CardTitle>
                <CardDescription>Enter your user ID to manage connections</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Label htmlFor="userId" className="text-sm font-medium text-gray-700">User ID</Label>
                  <Input
                    id="userId"
                    type="number"
                    value={userId}
                    onChange={(e) => handleUserIdChange(e.target.value)}
                    placeholder="Enter user ID"
                    className="h-11"
                  />
                  {checkingConnections && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking connections...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Brand Profile Management */}
            {userId && userId.trim() !== "" && (
              <BrandProfileForm userId={userId} />
            )}

            {/* Posting Preferences */}
            {userId && userId.trim() !== "" && (
              <PostingPreferencesForm 
                userId={userId} 
                maxPostingDays={permissions.maxPostingDays}
              />
            )}
          </div>

          {/* Right Column - Social Media Connections */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Social Media Connections</h2>
              <p className="text-gray-600 mb-6">Connect your Facebook and Instagram business accounts</p>
            </div>

            <div className="grid gap-6">
              {/* Facebook Connection */}
              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    {isConnected('facebook') && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
                    <Facebook className="h-6 w-6 text-blue-600 mr-2" />
                    Facebook Page
                  </CardTitle>
                  <CardDescription>
                    {isConnected('facebook') 
                      ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                          <span>to: {getConnectedAccount('facebook')?.account_name}</span>
                        </div>
                      )
                      : "Connect your Facebook business page to start managing posts"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isConnected('facebook') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button onClick={() => initiateOAuth('facebook')} variant="outline" size="lg" className="h-12">
                        <Facebook className="mr-2 h-4 w-4" />
                        Reconnect Page
                      </Button>
                      <Button 
                        onClick={() => handleDisconnect('facebook')} 
                        variant="destructive" 
                        size="lg"
                        className="h-12"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => initiateOAuth('facebook')} className="w-full h-12 bg-blue-600 hover:bg-blue-700" size="lg">
                      <Facebook className="mr-2 h-5 w-5" />
                      Connect Facebook Page
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Instagram Connection */}
              <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    {isConnected('instagram') && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
                    <Instagram className="h-6 w-6 text-pink-600 mr-2" />
                    Instagram Business
                  </CardTitle>
                  <CardDescription>
                    {isConnected('instagram') 
                      ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Connected
                          </span>
                          <span>to: @{getConnectedAccount('instagram')?.username || getConnectedAccount('instagram')?.account_name}</span>
                        </div>
                      )
                      : "Connect your Instagram business account to start managing posts"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isConnected('instagram') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button onClick={() => initiateOAuth('instagram')} variant="outline" size="lg" className="h-12">
                        <Instagram className="mr-2 h-4 w-4" />
                        Reconnect Account
                      </Button>
                      <Button 
                        onClick={() => handleDisconnect('instagram')} 
                        variant="destructive" 
                        size="lg"
                        className="h-12"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => initiateOAuth('instagram')} 
                      variant="secondary" 
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
                      size="lg"
                    >
                      <Instagram className="mr-2 h-5 w-5" />
                      Connect Instagram Business
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Footer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-medium">📋 Requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Instagram requires a Facebook Business account and Instagram Business account</li>
                  <li>App credentials are loaded automatically from the API</li>
                  <li>Add ?user_id=YOUR_ID to the URL to specify a different user ID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
