import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Outfit } from '@/types/app';
import { generateOutfit } from '@/utils/outfitGenerator';
import { Heart, RefreshCcw, Shirt, Sun, CalendarDays, CloudOff } from 'lucide-react'; // Added CloudOff
import { showSuccess, showError } from '@/utils/toast'; // Added showError
import { addOutfit } from '@/utils/outfitStorage';
import { useWeather } from '@/hooks/use-weather'; // Import the new hook

const Index: React.FC = () => {
  const [currentOutfit, setCurrentOutfit] = React.useState<Outfit | null>(null);
  const [isLoadingOutfit, setIsLoadingOutfit] = React.useState(false);
  const { temperature, condition, icon, city, country, isLoading: isLoadingWeather, error: weatherError } = useWeather();

  const handleGenerateOutfit = () => {
    setIsLoadingOutfit(true);
    // Simulate API call
    setTimeout(() => {
      const outfit = generateOutfit({
        temperature: temperature ?? undefined,
        condition: condition ?? undefined,
      });
      setCurrentOutfit(outfit);
      setIsLoadingOutfit(false);
      showSuccess("Outfit generated successfully!");
    }, 1000);
  };

  const handleSaveOutfit = () => {
    if (currentOutfit) {
      const outfitToSave = { ...currentOutfit, isFavorite: true };
      addOutfit(outfitToSave); // Save to outfit storage
      showSuccess("Outfit saved to favorites!");
    }
  };

  const handleMarkDirty = () => {
    if (currentOutfit) {
      const wornOutfit = { ...currentOutfit, lastWornDate: new Date().toISOString() };
      // In a real app, you might also mark individual clothing items as dirty
      addOutfit(wornOutfit); // Add as a worn outfit
      showSuccess("Outfit marked as worn!");
      setCurrentOutfit(null); // Clear current outfit after marking dirty
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Today's Outfit</CardTitle>
          <CardDescription className="text-lg">Your personalized style suggestion for the day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingWeather ? (
            <p className="text-muted-foreground">Loading weather...</p>
          ) : weatherError ? (
            <div className="flex flex-col items-center justify-center text-destructive">
              <CloudOff className="h-8 w-8 mb-2" />
              <p>{weatherError}</p>
              <p className="text-sm text-muted-foreground mt-2">Outfit suggestions might be less accurate without weather data.</p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              {icon && <img src={icon} alt={condition || 'Weather icon'} className="h-8 w-8" />}
              <span>{city}, {country}: {condition || 'N/A'}, {temperature}°C</span>
            </div>
          )}

          {currentOutfit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                {currentOutfit.calendarEventInfo && (
                  <>
                    <CalendarDays className="h-5 w-5 ml-4" />
                    <span>{currentOutfit.calendarEventInfo.eventName}</span>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Placeholder for outfit items */}
                {currentOutfit.itemIds.map((itemId, index) => (
                  <div key={itemId} className="flex flex-col items-center space-y-2">
                    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                      <Shirt className="h-12 w-12" />
                    </div>
                    <span className="text-sm text-center">Item {index + 1}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-muted-foreground italic">
                "{currentOutfit.explanation}"
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
                <Button onClick={handleSaveOutfit} variant="outline" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Save Outfit
                </Button>
                <Button onClick={handleGenerateOutfit} disabled={isLoadingOutfit} className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" /> {isLoadingOutfit ? 'Generating...' : 'Reroll Outfit'}
                </Button>
                <Button onClick={handleMarkDirty} variant="destructive" className="flex items-center gap-2">
                  Mark Worn/Dirty
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No outfit generated yet. Let's find you something great!
              </p>
              <Button onClick={handleGenerateOutfit} disabled={isLoadingOutfit} className="py-3 text-lg">
                {isLoadingOutfit ? 'Generating...' : 'Generate Today\'s Outfit'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;