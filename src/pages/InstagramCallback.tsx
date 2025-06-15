
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InstagramAccount {
  id: string;
  name: string;
  username: string;
  access_token: string;
}

const InstagramCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

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
      const storedState = localStorage.getItem("instagram_oauth_state");
      if (state !== storedState) {
        throw new Error("Invalid state parameter");
      }

      // Get stored credentials
      const appId = localStorage.getItem("fb_app_id");
      const appSecret = localStorage.getItem("fb_app_secret");

      if (!appId || !appSecret) {
        throw new Error("Missing app credentials");
      }

      // Exchange code for user access token
      const redirectUri = `${window.location.origin}/oauth-callback/instagram`;
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for access token");
      }

      const tokenData = await tokenResponse.json();
      const userAccessToken = tokenData.access_token;

      // Fetch user's pages first (Instagram accounts are connected to Facebook pages)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
      );

      if (!pagesResponse.ok) {
        throw new Error("Failed to fetch pages");
      }

      const pagesData = await pagesResponse.json();
      
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error("No Facebook pages found. You need a Facebook page connected to an Instagram business account.");
      }

      // For each page, check if it has an Instagram account
      const instagramAccounts: InstagramAccount[] = [];
      
      for (const page of pagesData.data) {
        try {
          const igResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
          );
          
          if (igResponse.ok) {
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
              // Get Instagram account details
              const igAccountResponse = await fetch(
                `https://graph.facebook.com/v21.0/${igData.instagram_business_account.id}?fields=name,username&access_token=${page.access_token}`
              );
              
              if (igAccountResponse.ok) {
                const igAccountData = await igAccountResponse.json();
                instagramAccounts.push({
                  id: igData.instagram_business_account.id,
                  name: igAccountData.name || page.name,
                  username: igAccountData.username || 'Unknown',
                  access_token: page.access_token
                });
              }
            }
          }
        } catch (err) {
          console.log(`No Instagram account for page ${page.name}`);
        }
      }

      if (instagramAccounts.length === 0) {
        throw new Error("No Instagram business accounts found. Please connect an Instagram business account to your Facebook page.");
      }

      setAccounts(instagramAccounts);
      
      // For one-click experience, automatically select the first account
      const firstAccount = instagramAccounts[0];
      setSelectedAccount(firstAccount);
      
      // Store the Instagram access token
      localStorage.setItem("ig_access_token", firstAccount.access_token);
      localStorage.setItem("ig_account_id", firstAccount.id);
      localStorage.setItem("ig_account_name", firstAccount.name);
      localStorage.setItem("ig_username", firstAccount.username);

      toast({
        title: "Success!",
        description: `Connected to Instagram account: @${firstAccount.username}`,
      });

      // Clean up OAuth state
      localStorage.removeItem("instagram_oauth_state");
      
    } catch (err) {
      console.error("Instagram OAuth callback error:", err);
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

  const handleAccountSelect = (account: InstagramAccount) => {
    setSelectedAccount(account);
    localStorage.setItem("ig_access_token", account.access_token);
    localStorage.setItem("ig_account_id", account.id);
    localStorage.setItem("ig_account_name", account.name);
    localStorage.setItem("ig_username", account.username);
    
    toast({
      title: "Account Selected",
      description: `Connected to Instagram account: @${account.username}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Processing Instagram connection...</span>
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
            Instagram Connected!
          </CardTitle>
          <CardDescription>
            {selectedAccount ? `Connected to: @${selectedAccount.username}` : "Choose an account to connect"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length > 1 && (
            <div>
              <p className="text-sm font-medium mb-2">Your Instagram Accounts:</p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <Button
                    key={account.id}
                    variant={selectedAccount?.id === account.id ? "default" : "outline"}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full justify-start"
                  >
                    @{account.username} - {account.name}
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
          
          {selectedAccount && (
            <div className="text-xs text-muted-foreground">
              <p>Account ID: {selectedAccount.id}</p>
              <p>Username: @{selectedAccount.username}</p>
              <p>Access token stored securely</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramCallback;
