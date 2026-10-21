import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CloudSun } from 'lucide-react';

const CalendarPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6">
      <Card className="w-full max-w-3xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Your Calendar & Weather</CardTitle>
          <CardDescription className="text-lg">See upcoming events and how they influence your outfits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-4 text-muted-foreground">
            <CalendarDays className="h-8 w-8" />
            <p className="text-xl">Calendar Integration Coming Soon!</p>
          </div>
          <div className="flex items-center justify-center space-x-4 text-muted-foreground">
            <CloudSun className="h-8 w-8" />
            <p className="text-xl">Weather Forecasts to Guide Your Style!</p>
          </div>
          <p className="text-muted-foreground">
            This page will display your connected calendar events and local weather,
            helping the outfit generator make smarter suggestions.
          </p>
          <p className="text-sm text-gray-500">
            (Placeholder for calendar component and weather display)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;