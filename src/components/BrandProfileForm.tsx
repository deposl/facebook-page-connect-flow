
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User } from "lucide-react";

interface BrandProfile {
  user_id: number;
  tone: string;
  voice: string;
  description: string;
}

interface BrandProfileFormProps {
  userId: string;
}

const TONE_OPTIONS = [
  "Friendly",
  "Luxurious", 
  "Playful",
  "Bold",
  "Minimalist",
  "Professional",
  "Fun",
  "Premium",
  "Inspirational"
];

const VOICE_OPTIONS = [
  "Confident",
  "Conversational",
  "Energetic", 
  "Formal",
  "Casual",
  "Humorous",
  "Warm",
  "Sophisticated",
  "Youthful"
];

const BrandProfileForm = ({ userId }: BrandProfileFormProps) => {
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    user_id: parseInt(userId),
    tone: "",
    voice: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId && userId.trim() !== "") {
      fetchBrandProfile();
    }
  }, [userId]);

  const fetchBrandProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/search-brand-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': 'Manoj'
        },
        body: JSON.stringify({ user_id: parseInt(userId) })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch brand profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Brand profile response:', result);
      
      if (result && Array.isArray(result) && result.length > 0) {
        const profile = result[0];
        setBrandProfile({
          user_id: profile.user_id,
          tone: profile.tone || "",
          voice: profile.voice || "",
          description: profile.description || ""
        });
        setHasExistingProfile(true);
      } else {
        // No existing profile - immediately show form for creation
        setBrandProfile({
          user_id: parseInt(userId),
          tone: "",
          voice: "",
          description: ""
        });
        setHasExistingProfile(false);
      }
    } catch (error) {
      console.error("Failed to fetch brand profile:", error);
      // On error, also show form for creation
      setBrandProfile({
        user_id: parseInt(userId),
        tone: "",
        voice: "",
        description: ""
      });
      setHasExistingProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!brandProfile.tone || !brandProfile.voice || !brandProfile.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const endpoint = hasExistingProfile 
        ? 'https://n8n-n8n.hnxdau.easypanel.host/webhook/update-brand-profile'
        : 'https://n8n-n8n.hnxdau.easypanel.host/webhook/insert-brand-profile';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': 'Manoj'
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          tone: brandProfile.tone,
          voice: brandProfile.voice,
          description: brandProfile.description
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save brand profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Brand profile save response:', result);

      setHasExistingProfile(true);
      
      toast({
        title: "Success!",
        description: hasExistingProfile ? "Brand profile updated successfully" : "Brand profile created successfully",
      });

    } catch (error) {
      console.error("Failed to save brand profile:", error);
      toast({
        title: "Error",
        description: `Failed to save brand profile: ${error}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof BrandProfile, value: string) => {
    setBrandProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Only show loading spinner during initial fetch, not when no data exists
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading brand profile...</span>
        </CardContent>
      </Card>
    );
  }

  // Always show the form, whether for creation or update
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Brand Profile Management
        </CardTitle>
        <CardDescription>
          {hasExistingProfile 
            ? "Update your brand's tone, voice, and description"
            : "Create your brand profile to define your tone, voice, and description"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Brand Tone</Label>
            <Select value={brandProfile.tone} onValueChange={(value) => handleFieldChange('tone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice">Brand Voice</Label>
            <Select value={brandProfile.voice} onValueChange={(value) => handleFieldChange('voice', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice} value={voice}>
                    {voice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Brand Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your brand, its values, target audience, and key messaging..."
            value={brandProfile.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            className="w-full" 
            disabled={saving}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {hasExistingProfile ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasExistingProfile ? "Update Brand Profile" : "Create Brand Profile"}
              </>
            )}
          </Button>
        </div>

        {hasExistingProfile && (
          <div className="text-xs text-muted-foreground">
            <p>Profile Status: Active</p>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrandProfileForm;
