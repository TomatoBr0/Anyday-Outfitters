import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shirt } from 'lucide-react';
import { Outfit } from '@/types/app';

const dummyFavoriteOutfits: Outfit[] = [
  {
    id: 'fav1', userId: 'user1', name: 'Weekend Casual', itemIds: ['item1', 'item2'],
    date: new Date().toISOString(), explanation: 'Perfect for a relaxed weekend.', isFavorite: true,
    generatedAt: new Date().toISOString(), weatherInfo: { temperature: 22, condition: 'Sunny' }
  },
  {
    id: 'fav2', userId: 'user1', name: 'Work Meeting Ready', itemIds: ['item3', 'item4'],
    date: new Date().toISOString(), explanation: 'Sharp and professional for your meeting.', isFavorite: true,
    generatedAt: new Date().toISOString(), calendarEventInfo: { eventName: 'Team Meeting', eventType: 'work' }
  },
];

const Favorites: React.FC = () => {
  const [favoriteOutfits, setFavoriteOutfits] = React.useState<Outfit[]>(dummyFavoriteOutfits);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Favorite Outfits</h1>

      {favoriteOutfits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">You haven't saved any favorite outfits yet!</p>
          <p className="text-muted-foreground">
            Generate an outfit on the Home page and click the "Save Outfit" button to add it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteOutfits.map((outfit) => (
            <Card key={outfit.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" /> {outfit.name || `Outfit for ${new Date(outfit.date).toLocaleDateString()}`}
                </CardTitle>
                <CardDescription>{outfit.explanation}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {outfit.itemIds.map((itemId, index) => (
                    <div key={itemId} className="flex flex-col items-center space-y-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                        <Shirt className="h-8 w-8" />
                      </div>
                      <span className="text-xs text-muted-foreground">Item {index + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Generated on: {new Date(outfit.generatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;