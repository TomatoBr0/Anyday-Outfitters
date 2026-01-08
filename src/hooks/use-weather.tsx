// src/hooks/use-weather.tsx
import * as React from 'react';
import { fetchWeatherData } from '@/services/weatherService';
import { showError } from '@/utils/toast';

interface WeatherState {
  temperature: number | null;
  condition: string | null;
  icon: string | null;
  city: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useWeather() {
  const [weather, setWeather] = React.useState<WeatherState>({
    temperature: null,
    condition: null,
    icon: null,
    city: null,
    country: null,
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    const getUserLocationAndWeather = async () => {
      setWeather((prev) => ({ ...prev, isLoading: true, error: null }));
      if (!navigator.geolocation) {
        setWeather((prev) => ({ ...prev, error: 'Geolocation is not supported by your browser.', isLoading: false }));
        showError('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const weatherData = await fetchWeatherData(latitude, longitude);

          if (weatherData) {
            setWeather({
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              icon: weatherData.icon,
              city: weatherData.city,
              country: weatherData.country,
              isLoading: false,
              error: null,
            });
          } else {
            setWeather((prev) => ({ ...prev, error: 'Failed to fetch weather data.', isLoading: false }));
            showError('Failed to fetch weather data. Please check your API key or network.');
          }
        },
        (geoError) => {
          let errorMessage = 'Failed to get your location.';
          if (geoError.code === geoError.PERMISSION_DENIED) {
            errorMessage = 'Location access denied. Please enable location services for this site.';
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable.';
          } else if (geoError.code === geoError.TIMEOUT) {
            errorMessage = 'The request to get user location timed out.';
          }
          setWeather((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
          showError(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    getUserLocationAndWeather();
  }, []);

  return weather;
}