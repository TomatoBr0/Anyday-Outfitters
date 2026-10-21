// src/services/weatherService.ts
interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  city: string;
  country: string;
}

export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData | null> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error('OpenWeatherMap API key is not set in VITE_OPENWEATHER_API_KEY environment variable.');
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      city: data.name,
      country: data.sys.country,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};