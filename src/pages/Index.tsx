
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram, Loader2, CheckCircle, X } from "lucide-react";
import { getAppCredentials, getConnectedAccounts, updateConnectionStatus } from "@/utils/apiService";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading app credentials...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Failed to Load Credentials</CardTitle>
            <CardDescription>
              Could not fetch Facebook app credentials from the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAppCredentials} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Social Media Connect</h1>
          <p className="text-muted-foreground">Connect your Facebook and Instagram pages with one click</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Configuration</CardTitle>
            <CardDescription>Enter your user ID to manage connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => handleUserIdChange(e.target.value)}
                placeholder="Enter user ID"
              />
              {checkingConnections && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Checking connections...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isConnected('facebook') && <CheckCircle className="h-4 w-4 text-green-600 mr-2" />}
                Connect Facebook Page
              </CardTitle>
              <CardDescription>
                {isConnected('facebook') 
                  ? `Connected to: ${getConnectedAccount('facebook')?.account_name}`
                  : "Click the button below to connect your Facebook page"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected('facebook') ? (
                <div className="space-y-2">
                  <Button onClick={() => initiateOAuth('facebook')} className="w-full" size="lg" variant="outline">
                    <Facebook className="mr-2 h-4 w-4" />
                    Reconnect Facebook Page
                  </Button>
                  <Button 
                    onClick={() => handleDisconnect('facebook')} 
                    className="w-full" 
                    size="lg" 
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Disconnect Facebook Page
                  </Button>
                </div>
              ) : (
                <Button onClick={() => initiateOAuth('facebook')} className="w-full" size="lg">
                  <Facebook className="mr-2 h-4 w-4" />
                  Connect Facebook Page
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isConnected('instagram') && <CheckCircle className="h-4 w-4 text-green-600 mr-2" />}
                Connect Instagram Page
              </CardTitle>
              <CardDescription>
                {isConnected('instagram') 
                  ? `Connected to: @${getConnectedAccount('instagram')?.username || getConnectedAccount('instagram')?.account_name}`
                  : "Click the button below to connect your Instagram business account"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected('instagram') ? (
                <div className="space-y-2">
                  <Button onClick={() => initiateOAuth('instagram')} className="w-full" size="lg" variant="outline">
                    <Instagram className="mr-2 h-4 w-4" />
                    Reconnect Instagram Page
                  </Button>
                  <Button 
                    onClick={() => handleDisconnect('instagram')} 
                    className="w-full" 
                    size="lg" 
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Disconnect Instagram Page
                  </Button>
                </div>
              ) : (
                <Button onClick={() => initiateOAuth('instagram')} className="w-full" size="lg" variant="secondary">
                  <Instagram className="mr-2 h-4 w-4" />
                  Connect Instagram Page
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>App credentials loaded from API automatically.</p>
          <p>Instagram requires a Facebook Business account and Instagram Business account.</p>
          <p>Add ?user_id=YOUR_ID to the URL to specify a different user ID.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
