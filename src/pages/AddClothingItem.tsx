import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClothingItem } from '@/types/app';
import { showSuccess, showError } from '@/utils/toast'; // Added showError
import { addClothingItem } from '@/utils/clothingStorage';

const clothingTypes = ['shirt', 'pants', 'jacket', 'shoes', 'accessory', 'other'];
const styles = ['casual', 'streetwear', 'formal', 'athletic', 'vintage', 'business casual', 'bohemian', 'minimalist', 'preppy', 'gothic', 'punk', 'other'];
const fits = ['oversized', 'slim', 'regular'];
const seasons = ['summer', 'winter', 'spring', 'autumn', 'all-season'];
const warmthLevels = ['light', 'medium', 'warm', 'very warm'];
const occasions = ['school', 'work', 'travel', 'event', 'casual', 'sport', 'party', 'sleep', 'other'];
const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'purple', 'orange', 'multi'];

const AddClothingItem: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState<Partial<ClothingItem>>({
    name: '',
    imageUrl: '',
    clothingType: undefined,
    style: undefined,
    fit: undefined,
    season: undefined,
    colors: [],
    warmthLevel: undefined,
    occasion: undefined,
    isClean: true,
  });
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'imageUrl') {
      setImagePreview(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showError('Image size exceeds 2MB. Please choose a smaller image.');
        e.target.value = ''; // Clear the input
        setImagePreview(null);
        setFormData((prev) => ({ ...prev, imageUrl: '' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({ ...prev, imageUrl: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSelectChange = (id: keyof ClothingItem, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleColorChange = (color: string) => {
    setFormData((prev) => {
      const currentColors = prev.colors || [];
      if (currentColors.includes(color)) {
        return { ...prev, colors: currentColors.filter((c) => c !== color) };
      } else {
        return { ...prev, colors: [...currentColors, color] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate necessary fields for a complete ClothingItem
    const newItem: ClothingItem = {
      id: `item-${Date.now()}`, // Simple unique ID
      userId: 'user1', // Placeholder user ID
      uploadedAt: new Date().toISOString(),
      isClean: true, // Default to clean when added
      isFavorite: false,
      ...formData,
      name: formData.name || 'Unnamed Item', // Ensure name is not empty
      imageUrl: formData.imageUrl || 'https://via.placeholder.com/150/CCCCCC/000000?text=No+Image', // Default image
      clothingType: formData.clothingType || 'other',
      style: formData.style || 'casual',
      fit: formData.fit || 'regular',
      season: formData.season || 'all-season',
      colors: formData.colors || [],
      warmthLevel: formData.warmthLevel || 'light',
      occasion: formData.occasion || 'casual',
    };

    addClothingItem(newItem); // Save the new item to local storage
    showSuccess('Clothing item added successfully!');
    navigate('/closet');
  };

  return (
    <div className="p-4 md:p-6">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Clothing Item</CardTitle>
          <CardDescription>Fill in the details for your new wardrobe addition.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="e.g., https://example.com/shirt.jpg" />
              <p className="text-sm text-muted-foreground">
                Or upload an image:
              </p>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                capture="environment" // 'environment' for rear camera, 'user' for front camera
                onChange={handleFileChange}
                className="mt-2"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img src={imagePreview} alt="Image Preview" className="w-32 h-32 object-cover rounded-md mx-auto" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clothingType">Clothing Type</Label>
              <Select onValueChange={(value) => handleSelectChange('clothingType', value)} value={formData.clothingType}>
                <SelectTrigger id="clothingType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {clothingTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select onValueChange={(value) => handleSelectChange('style', value)} value={formData.style}>
                <SelectTrigger id="style">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fit">Fit</Label>
              <Select onValueChange={(value) => handleSelectChange('fit', value)} value={formData.fit}>
                <SelectTrigger id="fit">
                  <SelectValue placeholder="Select fit" />
                </SelectTrigger>
                <SelectContent>
                  {fits.map((fit) => (
                    <SelectItem key={fit} value={fit}>{fit.charAt(0).toUpperCase() + fit.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select onValueChange={(value) => handleSelectChange('season', value)} value={formData.season}>
                <SelectTrigger id="season">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season}>{season.charAt(0).toUpperCase() + season.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warmthLevel">Warmth Level</Label>
              <Select onValueChange={(value) => handleSelectChange('warmthLevel', value)} value={formData.warmthLevel}>
                <SelectTrigger id="warmthLevel">
                  <SelectValue placeholder="Select warmth" />
                </SelectTrigger>
                <SelectContent>
                  {warmthLevels.map((level) => (
                    <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select onValueChange={(value) => handleSelectChange('occasion', value)} value={formData.occasion}>
                <SelectTrigger id="occasion">
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map((occasion) => (
                    <SelectItem key={occasion} value={occasion}>{occasion.charAt(0).toUpperCase() + occasion.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Button
                    key={color}
                    type="button"
                    variant={formData.colors?.includes(color) ? 'default' : 'outline'}
                    onClick={() => handleColorChange(color)}
                    className="capitalize"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="w-full md:w-auto py-3 text-lg">Add Item to Closet</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClothingItem;