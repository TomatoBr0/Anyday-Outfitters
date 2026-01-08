import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added Button import

const Settings: React.FC = () => {
  const [calendarConnected, setCalendarConnected] = React.useState(false);
  const [isPremium, setIsPremium] = React.useState(false); // Simulate premium status

  return (
    <div className="p-4 md:p-6">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <SettingsIcon className="h-7 w-7" /> Settings
          </CardTitle>
          <CardDescription className="text-lg">Manage your app preferences and integrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Account & Preferences</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="calendar-connect" className="text-base">Connect Calendar</Label>
              <Switch
                id="calendar-connect"
                checked={calendarConnected}
                onCheckedChange={setCalendarConnected}
                disabled={!isPremium} // Example: calendar connect might be premium
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your calendar to get outfit suggestions tailored to your events.
              {isPremium ? '' : ' (Premium feature)'}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Premium Features</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="premium-status" className="text-base flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" /> Premium Status
              </Label>
              <Switch
                id="premium-status"
                checked={isPremium}
                onCheckedChange={setIsPremium} // In a real app, this would be managed by subscription
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock advanced outfit analytics, smart speaker integration, and more detailed style customization.
            </p>
            {!isPremium && (
              <Button className="w-full mt-4">Upgrade to Premium</Button>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="text-muted-foreground">
              AnyDay Outfitters v1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              Your smart outfit-planning and digital wardrobe assistant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;