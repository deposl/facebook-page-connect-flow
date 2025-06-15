import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { saveConnectionData } from "@/utils/apiService";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  long_lived_token?: string;
}

const FacebookCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const exchangeForLongLivedToken = async (shortLivedToken: string, appId: string, appSecret: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to exchange for long-lived token");
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (err) {
      console.error("Error exchanging for long-lived token:", err);
      return shortLivedToken; // Fallback to short-lived token
    }
  };

  const handleOAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error("No authorization code received");
      }

      // Verify state to prevent CSRF attacks
      const storedState = localStorage.getItem("facebook_oauth_state");
      console.log("Received state:", state);
      console.log("Stored state:", storedState);
      
      if (state !== storedState) {
        throw new Error("Invalid state parameter - this might be a security issue. Please try connecting again.");
      }

      // Get stored credentials
      const appId = localStorage.getItem("fb_app_id");
      const appSecret = localStorage.getItem("fb_app_secret");
      const userId = localStorage.getItem("user_id");

      if (!appId || !appSecret || !userId) {
        throw new Error("Missing app credentials or user ID");
      }

      // Exchange code for user access token
      const redirectUri = `${window.location.origin}/oauth-callback/facebook`;
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for access token");
      }

      const tokenData = await tokenResponse.json();
      const userAccessToken = tokenData.access_token;

      // Exchange for long-lived user token
      const longLivedUserToken = await exchangeForLongLivedToken(userAccessToken, appId, appSecret);

      // Fetch user's pages with long-lived token
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedUserToken}`
      );

      if (!pagesResponse.ok) {
        throw new Error("Failed to fetch pages");
      }

      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("No Facebook pages found. Please create a Facebook Page or ensure you're an admin of at least one page.");
      }

      // Process pages with long-lived tokens
      const pagesWithLongTokens = await Promise.all(
        pagesData.data.map(async (page: FacebookPage) => {
          const longLivedPageToken = await exchangeForLongLivedToken(page.access_token, appId, appSecret);
          return {
            ...page,
            long_lived_token: longLivedPageToken
          };
        })
      );

      setPages(pagesWithLongTokens);
      
      // For one-click experience, automatically select the first page
      const firstPage = pagesWithLongTokens[0];
      setSelectedPage(firstPage);
      
      // Store both short and long-lived tokens
      localStorage.setItem("fb_page_access_token", firstPage.access_token);
      localStorage.setItem("fb_page_long_lived_token", firstPage.long_lived_token || firstPage.access_token);
      localStorage.setItem("fb_page_id", firstPage.id);
      localStorage.setItem("fb_page_name", firstPage.name);

      // Prepare data for API endpoint
      const apiData = {
        user_id: parseInt(userId),
        platform: "facebook",
        account_id: firstPage.id,
        account_name: firstPage.name,
        access_token: firstPage.access_token,
        long_lived_token: firstPage.long_lived_token || firstPage.access_token,
        expires_in: "60 days",
        connected_at: new Date().toISOString(),
        app_id: appId
      };

      console.log("Facebook API Data to save:", apiData);
      localStorage.setItem("fb_api_data", JSON.stringify(apiData));

      // Save to API
      try {
        await saveConnectionData(apiData);
        toast({
          title: "Success!",
          description: `Connected to Facebook page: ${firstPage.name} and saved to database`,
        });
      } catch (apiError) {
        console.error("Failed to save to API:", apiError);
        toast({
          title: "Connected but Save Failed",
          description: `Connected to Facebook page but failed to save to database: ${apiError}`,
          variant: "destructive",
        });
      }

      // Clean up OAuth state
      localStorage.removeItem("facebook_oauth_state");
      
    } catch (err) {
      console.error("OAuth callback error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = async (page: FacebookPage) => {
    setSelectedPage(page);
    localStorage.setItem("fb_page_access_token", page.access_token);
    localStorage.setItem("fb_page_long_lived_token", page.long_lived_token || page.access_token);
    localStorage.setItem("fb_page_id", page.id);
    localStorage.setItem("fb_page_name", page.name);
    
    const userId = localStorage.getItem("user_id");
    const appId = localStorage.getItem("fb_app_id");
    
    if (userId && appId) {
      // Update API data
      const apiData = {
        user_id: parseInt(userId),
        platform: "facebook",
        account_id: page.id,
        account_name: page.name,
        access_token: page.access_token,
        long_lived_token: page.long_lived_token || page.access_token,
        expires_in: "60 days",
        connected_at: new Date().toISOString(),
        app_id: appId
      };
      
      localStorage.setItem("fb_api_data", JSON.stringify(apiData));
      
      try {
        await saveConnectionData(apiData);
        toast({
          title: "Page Selected",
          description: `Connected to Facebook page: ${page.name} and updated in database`,
        });
      } catch (apiError) {
        console.error("Failed to update API:", apiError);
        toast({
          title: "Selected but Update Failed",
          description: `Page selected but failed to update database: ${apiError}`,
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Processing Facebook connection...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-2" />
              Connection Failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Facebook Connected!
          </CardTitle>
          <CardDescription>
            {selectedPage ? `Connected to: ${selectedPage.name}` : "Choose a page to connect"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pages.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-2">Your Facebook Pages:</p>
              <div className="space-y-2">
                {pages.map((page) => (
                  <Button
                    key={page.id}
                    variant={selectedPage?.id === page.id ? "default" : "outline"}
                    onClick={() => handlePageSelect(page)}
                    className="w-full justify-start"
                  >
                    {page.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Button onClick={() => navigate("/")} className="w-full">
              Continue
            </Button>
          </div>
          
          {selectedPage && (
            <div className="text-xs text-muted-foreground">
              <p>Page ID: {selectedPage.id}</p>
              <p>Long-lived token generated</p>
              <p>Token expires: ~60 days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookCallback;
