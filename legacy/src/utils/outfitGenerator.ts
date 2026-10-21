import { Outfit } from '@/types/app';

interface GenerateOutfitOptions {
  temperature?: number;
  condition?: string;
}

export const generateOutfit = (options?: GenerateOutfitOptions): Outfit => {
  const outfitId = `outfit-${Date.now()}`;
  const userId = 'user1'; // Placeholder user ID
  const date = new Date().toISOString();

  const explanations = [
    "This outfit is perfect for today's sunny weather and your casual plans.",
    "A smart choice for your work event, balancing comfort and professionalism.",
    "Stay warm and stylish with this ensemble, ideal for the chilly weather.",
    "Embrace a relaxed vibe with these pieces, great for a day out.",
    "This combination reflects your preferred streetwear style.",
  ];

  let weatherTemperature = options?.temperature ?? (Math.floor(Math.random() * 20) + 10); // 10-30°C
  let weatherCondition = options?.condition ?? (Math.random() > 0.5 ? 'Sunny' : 'Cloudy');

  const randomExplanation = explanations[Math.floor(Math.random() * explanations.length)];

  return {
    id: outfitId,
    userId: userId,
    itemIds: [`item${Math.floor(Math.random() * 100)}`, `item${Math.floor(Math.random() * 100)}`, `item${Math.floor(Math.random() * 100)}`], // Dummy item IDs
    date: date,
    weatherInfo: {
      temperature: weatherTemperature,
      condition: weatherCondition,
    },
    calendarEventInfo: Math.random() > 0.7 ? { eventName: 'Team Meeting', eventType: 'work' } : undefined,
    explanation: randomExplanation,
    isFavorite: false,
    generatedAt: date,
  };
};