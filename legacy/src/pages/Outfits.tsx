import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shirt, Trash2, CalendarDays } from 'lucide-react';
import { Outfit } from '@/types/app';
import { getOutfits, updateOutfit, deleteOutfit } from '@/utils/outfitStorage';
import { showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';

const Outfits: React.FC = () => {
  const [allOutfits, setAllOutfits] = React.useState<Outfit[]>([]);

  React.useEffect(() => {
    setAllOutfits(getOutfits());
  }, []);

  const handleToggleFavorite = (outfit: Outfit) => {
    const updatedOutfit = { ...outfit, isFavorite: !outfit.isFavorite };
    updateOutfit(updatedOutfit);
    setAllOutfits(getOutfits()); // Refresh state
    showSuccess(updatedOutfit.isFavorite ? 'Outfit added to favorites!' : 'Outfit removed from favorites.');
  };

  const handleDeleteOutfit = (outfitId: string) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      deleteOutfit(outfitId);
      setAllOutfits(getOutfits()); // Refresh state
      showSuccess('Outfit deleted successfully!');
    }
  };

  const favoriteOutfits = allOutfits.filter(outfit => outfit.isFavorite);
  const wornOutfits = allOutfits.filter(outfit => outfit.lastWornDate).sort((a, b) => new Date(b.lastWornDate!).getTime() - new Date(a.lastWornDate!).getTime());

  const renderOutfitCard = (outfit: Outfit) => (
    <Card key={outfit.id} className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {outfit.isFavorite && <Heart className="h-5 w-5 text-destructive fill-destructive" />}
          {outfit.name || `Outfit for ${new Date(outfit.date).toLocaleDateString()}`}
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
        {outfit.lastWornDate && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <CalendarDays className="h-4 w-4" /> Last worn: {new Date(outfit.lastWornDate).toLocaleDateString()}
          </p>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
            onClick={() => handleToggleFavorite(outfit)}
            aria-label="Toggle favorite"
          >
            <Heart className={outfit.isFavorite ? "h-4 w-4 text-red-500 fill-red-500" : "h-4 w-4 text-muted-foreground"} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
            onClick={() => handleDeleteOutfit(outfit.id)}
            aria-label="Delete outfit"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Outfits</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Favorite Outfits</h2>
        {favoriteOutfits.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>You haven't saved any favorite outfits yet!</p>
            <p>Generate an outfit on the Home page and click "Save Outfit" to add it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteOutfits.map(renderOutfitCard)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Recently Worn Outfits</h2>
        {wornOutfits.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>You haven't marked any outfits as worn yet!</p>
            <p>Generate an outfit on the Home page and click "Mark Worn/Dirty" to track it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wornOutfits.map(renderOutfitCard)}
          </div>
        )}
      </section>

      {allOutfits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">Start generating and saving outfits to see them here!</p>
        </div>
      )}
    </div>
  );
};

export default Outfits;