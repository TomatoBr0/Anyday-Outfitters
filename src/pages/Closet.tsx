import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClothingItem } from '@/types/app';
import { PlusCircle, Shirt, Heart, Trash2 } from 'lucide-react';
import { getClothingItems, setClothingItems, deleteClothingItem, updateClothingItem } from '@/utils/clothingStorage';
import { showSuccess, showError } from '@/utils/toast';

// Initial dummy data for demonstration, only set if local storage is empty
const initialDummyClothingItems: ClothingItem[] = [
  {
    id: '1', userId: 'user1', name: 'Blue T-Shirt', imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Blue+Tee',
    clothingType: 'shirt', style: 'casual', fit: 'regular', season: 'all-season', colors: ['blue'], warmthLevel: 'light',
    occasion: 'casual', isClean: true, uploadedAt: new Date().toISOString(), isFavorite: false
  },
  {
    id: '2', userId: 'user1', name: 'Denim Jeans', imageUrl: 'https://via.placeholder.com/150/4682B4/FFFFFF?text=Jeans',
    clothingType: 'pants', style: 'casual', fit: 'slim', season: 'all-season', colors: ['blue'], warmthLevel: 'medium',
    occasion: 'casual', isClean: true, uploadedAt: new Date().toISOString(), isFavorite: false
  },
  {
    id: '3', userId: 'user1', name: 'Leather Jacket', imageUrl: 'https://via.placeholder.com/150/36454F/FFFFFF?text=Jacket',
    clothingType: 'jacket', style: 'streetwear', fit: 'regular', season: 'autumn', colors: ['black'], warmthLevel: 'warm',
    occasion: 'event', isClean: false, uploadedAt: new Date().toISOString(), isFavorite: true
  },
  {
    id: '4', userId: 'user1', name: 'White Sneakers', imageUrl: 'https://via.placeholder.com/150/FFFFFF/000000?text=Sneakers',
    clothingType: 'shoes', style: 'athletic', fit: 'regular', season: 'all-season', colors: ['white'], warmthLevel: 'light',
    occasion: 'sport', isClean: true, uploadedAt: new Date().toISOString(), isFavorite: false
  },
];

const Closet: React.FC = () => {
  const [clothingItems, setClothingItemsState] = React.useState<ClothingItem[]>([]);
  const [hoveredItemId, setHoveredItemId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedItems = getClothingItems();
    if (storedItems.length === 0) {
      setClothingItems(initialDummyClothingItems);
      setClothingItemsState(initialDummyClothingItems);
    } else {
      setClothingItemsState(storedItems);
    }
  }, []);

  const handleDelete = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteClothingItem(itemId);
      setClothingItemsState(getClothingItems()); // Refresh state
      showSuccess('Item deleted successfully!');
    }
  };

  const handleToggleFavorite = (item: ClothingItem) => {
    const updatedItem = { ...item, isFavorite: !item.isFavorite };
    updateClothingItem(updatedItem);
    setClothingItemsState(getClothingItems()); // Refresh state
    showSuccess(updatedItem.isFavorite ? 'Added to favorites!' : 'Removed from favorites.');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Digital Closet</h1>
        <Link to="/add-item">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add New Item
          </Button>
        </Link>
      </div>

      {clothingItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">Your closet is empty! Start by adding some items.</p>
          <Link to="/add-item">
            <Button className="py-3 text-lg">Add Your First Item</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {clothingItems.map((item) => (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <Card className="flex flex-col items-center text-center h-full">
                <CardContent className="p-4 relative w-full">
                  {item.imageUrl && item.imageUrl !== 'https://via.placeholder.com/150/CCCCCC/000000?text=No+Image' ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded-md mb-2" />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 mb-2">
                      <Shirt className="h-16 w-16" />
                    </div>
                  )}
                  <h3 className="font-semibold text-base truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{item.clothingType}</p>
                  {!item.isClean && (
                    <span className="text-xs text-destructive mt-1">Dirty</span>
                  )}
                </CardContent>
              </Card>
              {hoveredItemId === item.id && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete item"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={() => handleToggleFavorite(item)}
                    aria-label="Toggle favorite"
                  >
                    <Heart className={item.isFavorite ? "h-4 w-4 text-red-500 fill-red-500" : "h-4 w-4 text-muted-foreground"} />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Closet;