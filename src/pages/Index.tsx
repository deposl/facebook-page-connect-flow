
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Instagram } from "lucide-react";

const Index = () => {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [userId, setUserId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const handleSaveCredentials = () => {
    if (!appId || !appSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both App ID and App Secret",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Missing User ID",
        description: "Please enter a User ID",
        variant: "destructive",
      });
      return;
    }

    // Store credentials in localStorage for development
    localStorage.setItem("fb_app_id", appId);
    localStorage.setItem("fb_app_secret", appSecret);
    localStorage.setItem("user_id", userId);
    setIsConfigured(true);
    
    toast({
      title: "Credentials Saved",
      description: "Facebook app credentials and User ID have been saved locally",
    });
  };

  const initiateOAuth = (platform: 'facebook' | 'instagram') => {
    const storedAppId = localStorage.getItem("fb_app_id");
    const storedUserId = localStorage.getItem("user_id");
    
    if (!storedAppId) {
      toast({
        title: "Configuration Missing",
        description: "Please configure your Facebook app credentials first",
        variant: "destructive",
      });
      return;
    }

    if (!storedUserId) {
      toast({
        title: "User ID Missing",
        description: "Please enter a User ID first",
        variant: "destructive",
      });
      return;
    }

    // Generate a random state for CSRF protection with platform-specific key
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(`${platform}_oauth_state`, state);

    const redirectUri = `${window.location.origin}/oauth-callback/${platform}`;
    
    // Different scopes for Facebook vs Instagram
    const scope = platform === 'facebook' 
      ? "pages_show_list,pages_manage_posts,pages_read_engagement"
      : "instagram_basic,pages_show_list";
    
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${storedAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
    
    window.location.href = oauthUrl;
  };

  const checkExistingConfig = () => {
    const storedAppId = localStorage.getItem("fb_app_id");
    const storedAppSecret = localStorage.getItem("fb_app_secret");
    const storedUserId = localStorage.getItem("user_id");
    
    if (storedAppId && storedAppSecret && storedUserId) {
      setAppId(storedAppId);
      setAppSecret(storedAppSecret);
      setUserId(storedUserId);
      setIsConfigured(true);
    }
  };

  // Check for existing configuration on component mount
  useState(() => {
    checkExistingConfig();
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Social Media Connect</h1>
          <p className="text-muted-foreground">Connect your Facebook and Instagram pages with one click</p>
        </div>

        {!isConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle>Configure Facebook App</CardTitle>
              <CardDescription>
                Enter your Facebook App credentials and User ID to enable OAuth flow for both Facebook and Instagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your User ID"
                />
              </div>
              <div>
                <Label htmlFor="appId">Facebook App ID</Label>
                <Input
                  id="appId"
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Your Facebook App ID"
                />
              </div>
              <div>
                <Label htmlFor="appSecret">Facebook App Secret</Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="Your Facebook App Secret"
                />
              </div>
              <Button onClick={handleSaveCredentials} className="w-full">
                Save Credentials
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connect Facebook Page</CardTitle>
                <CardDescription>
                  Click the button below to connect your Facebook page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => initiateOAuth('facebook')} className="w-full" size="lg">
                  <Facebook className="mr-2 h-4 w-4" />
                  Connect Facebook Page
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connect Instagram Page</CardTitle>
                <CardDescription>
                  Click the button below to connect your Instagram business account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => initiateOAuth('instagram')} className="w-full" size="lg" variant="secondary">
                  <Instagram className="mr-2 h-4 w-4" />
                  Connect Instagram Page
                </Button>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              onClick={() => setIsConfigured(false)} 
              className="w-full"
            >
              Reconfigure Credentials
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Note: For production use, credentials should be stored securely on the backend.</p>
          <p>Instagram requires a Facebook Business account and Instagram Business account.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
