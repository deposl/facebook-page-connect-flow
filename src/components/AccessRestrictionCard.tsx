
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ExternalLink } from "lucide-react";

const AccessRestrictionCard = () => {
  const handleUpgrade = () => {
    window.open('https://www.zada.lk/seller/seller-packages', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-orange-200">
        <CardHeader className="text-center bg-orange-50 border-b border-orange-200">
          <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-4">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-orange-800">Access Restricted</CardTitle>
          <CardDescription className="text-orange-700">
            Your current plan does not allow access to the Social Media Automation Tool. Please upgrade your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-orange-600 hover:bg-orange-700" 
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Upgrade Your Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRestrictionCard;
