import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Clock, Calendar } from "lucide-react";
import { insertPostPreference, searchPostPreference, updatePostPreference } from "@/utils/apiService";

interface PostingPreference {
  user_id: number;
  posting_days: string;
  posting_time: string;
  manual_review: number;
  notification_days: string;
  consent: number;
}

interface PostingPreferencesFormProps {
  userId: string;
  maxPostingDays?: number;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const PostingPreferencesForm = ({ userId, maxPostingDays = 7 }: PostingPreferencesFormProps) => {
  const [preferences, setPreferences] = useState<PostingPreference>({
    user_id: parseInt(userId),
    posting_days: "",
    posting_time: "10:00:00",
    manual_review: 0,
    notification_days: "",
    consent: 0
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingPreference, setHasExistingPreference] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId && userId.trim() !== "") {
      fetchPostingPreferences();
    }
  }, [userId]);

  const fetchPostingPreferences = async () => {
    try {
      setLoading(true);
      const result = await searchPostPreference(parseInt(userId));
      
      // Check if result has actual data (not just empty object)
      if (result && Array.isArray(result) && result.length > 0) {
        const preference = result[0];
        // Check if the preference has actual data (not just an empty object)
        if (preference && (preference.posting_days || preference.posting_time || preference.manual_review !== undefined)) {
          const days = preference.posting_days ? preference.posting_days.split(',') : [];
          
          setPreferences({
            user_id: preference.user_id,
            posting_days: preference.posting_days || "",
            posting_time: preference.posting_time || "10:00:00",
            manual_review: preference.manual_review || 0,
            notification_days: preference.notification_days || "",
            consent: preference.consent || 0
          });
          setSelectedDays(days);
          setHasExistingPreference(true);
        } else {
          // Empty object or missing required fields - treat as no data
          setPreferences({
            user_id: parseInt(userId),
            posting_days: "",
            posting_time: "10:00:00",
            manual_review: 0,
            notification_days: "",
            consent: 0
          });
          setSelectedDays([]);
          setHasExistingPreference(false);
        }
      } else {
        // No existing preference - immediately show form for creation
        setPreferences({
          user_id: parseInt(userId),
          posting_days: "",
          posting_time: "10:00:00",
          manual_review: 0,
          notification_days: "",
          consent: 0
        });
        setSelectedDays([]);
        setHasExistingPreference(false);
      }
    } catch (error) {
      console.error("Failed to fetch posting preferences:", error);
      // On error, also show form for creation
      setPreferences({
        user_id: parseInt(userId),
        posting_days: "",
        posting_time: "10:00:00",
        manual_review: 0,
        notification_days: "",
        consent: 0
      });
      setSelectedDays([]);
      setHasExistingPreference(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    let updatedDays;
    if (checked) {
      // Check if we're at the limit before adding
      if (selectedDays.length >= maxPostingDays) {
        toast({
          title: "Selection Limit Reached",
          description: `You can only select up to ${maxPostingDays} days with your current plan`,
          variant: "destructive",
        });
        return;
      }
      updatedDays = [...selectedDays, day];
    } else {
      updatedDays = selectedDays.filter(d => d !== day);
    }
    setSelectedDays(updatedDays);
    setPreferences(prev => ({
      ...prev,
      posting_days: updatedDays.join(',')
    }));
  };

  const handleTimeChange = (time: string) => {
    setPreferences(prev => ({
      ...prev,
      posting_time: time
    }));
  };

  const handleManualReviewToggle = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      manual_review: checked ? 1 : 0,
      notification_days: checked ? prev.notification_days : ""
    }));
  };

  const handleNotificationDayChange = (day: string) => {
    setPreferences(prev => ({
      ...prev,
      notification_days: day
    }));
  };

  const handleConsentToggle = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      consent: checked ? 1 : 0
    }));
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one posting day",
        variant: "destructive",
      });
      return;
    }

    if (preferences.manual_review === 1 && !preferences.notification_days) {
      toast({
        title: "Missing Information", 
        description: "Please select a notification day for manual review",
        variant: "destructive",
      });
      return;
    }

    if (preferences.consent !== 1) {
      toast({
        title: "Consent Required",
        description: "Please accept the AI content consent before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      if (hasExistingPreference) {
        await updatePostPreference(preferences);
      } else {
        await insertPostPreference(preferences);
      }

      setHasExistingPreference(true);
      
      toast({
        title: "Success!",
        description: hasExistingPreference ? "Posting preferences updated successfully" : "Posting preferences created successfully",
      });

    } catch (error) {
      console.error("Failed to save posting preferences:", error);
      toast({
        title: "Error",
        description: `Failed to save posting preferences: ${error}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        // Convert to 12-hour format with AM/PM
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const displayString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
        
        options.push({ value: timeString, label: displayString });
      }
    }
    return options;
  };

  // Only show loading spinner during initial fetch, not when no data exists
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading posting preferences...</span>
        </CardContent>
      </Card>
    );
  }

  // Always show the form, whether for creation or update
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Posting Preferences
        </CardTitle>
        <CardDescription>
          {hasExistingPreference 
            ? "Update your posting schedule and preferences"
            : "Set up your posting schedule and preferences"
          }
          {maxPostingDays < 7 && (
            <span className="block text-orange-600 text-sm mt-1">
              Your plan allows up to {maxPostingDays} posting days
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Posting Days */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Posting Days {maxPostingDays < 7 && `(Max: ${maxPostingDays})`}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);
              const isDisabled = !isSelected && selectedDays.length >= maxPostingDays;
              
              return (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                    className={isDisabled ? "opacity-50" : ""}
                  />
                  <Label 
                    htmlFor={day} 
                    className={`text-sm cursor-pointer ${isDisabled ? "text-gray-400" : ""}`}
                  >
                    {day}
                  </Label>
                </div>
              );
            })}
          </div>
          {maxPostingDays < 7 && selectedDays.length >= maxPostingDays && (
            <p className="text-xs text-orange-600">
              You've reached the maximum number of posting days for your plan
            </p>
          )}
        </div>

        {/* Posting Time */}
        <div className="space-y-2">
          <Label htmlFor="posting-time">Posting Time (24-hour format)</Label>
          <Select value={preferences.posting_time} onValueChange={handleTimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select posting time" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {generateTimeOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Manual Review */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="manual-review" className="text-sm font-medium">
              Manual Review
            </Label>
            <p className="text-xs text-muted-foreground">
              I want to manually review posts before publishing
            </p>
          </div>
          <Switch
            id="manual-review"
            checked={preferences.manual_review === 1}
            onCheckedChange={handleManualReviewToggle}
          />
        </div>

        {/* Notification Day (only if manual review is enabled) */}
        {preferences.manual_review === 1 && (
          <div className="space-y-2">
            <Label htmlFor="notification-day">Notification Day</Label>
            <Select value={preferences.notification_days} onValueChange={handleNotificationDayChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="flex items-start space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Checkbox
            id="consent"
            checked={preferences.consent === 1}
            onCheckedChange={handleConsentToggle}
          />
          <Label htmlFor="consent" className="text-sm cursor-pointer leading-relaxed">
            I understand that the post content is generated using AI, and AI can make mistakes.
          </Label>
        </div>

        {/* Save Button */}
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
                {hasExistingPreference ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {hasExistingPreference ? "Update Preferences" : "Create Preferences"}
              </>
            )}
          </Button>
        </div>

        {hasExistingPreference && (
          <div className="text-xs text-muted-foreground">
            <p>Preferences Status: Active</p>
            <p>Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostingPreferencesForm;
