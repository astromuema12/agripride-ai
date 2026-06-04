'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getWeatherData } from '@/lib/db';
import type { WeatherData } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ThermometerSun, Droplets, Wind, CloudSun, Umbrella, MapPin,
} from 'lucide-react';

const CONDITION_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  partly_cloudy: '⛅',
  clear: '🌙',
};

function ConditionIcon({ condition }: { condition: string }) {
  const icon = CONDITION_ICONS[condition.toLowerCase().replace(/\s+/g, '_')] || '🌤️';
  return <span className="text-2xl">{icon}</span>;
}

export default function WeatherPage() {
  const { user } = useAuth();

  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getWeatherData();
        setWeatherList(data);
        if (data.length > 0 && !selectedLocation) {
          setSelectedLocation(data[0].location);
        }
      } catch {
        toast.error('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedLocation]);

  if (!user) return null;

  const currentWeather = weatherList.find((w) => w.location === selectedLocation) || weatherList[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weather Intelligence</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time weather data and 7-day forecast for your region
          </p>
        </div>
        {weatherList.length > 1 && (
          <div className="w-full sm:w-64">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {weatherList.map((w) => (
                  <SelectItem key={w.location} value={w.location}>{w.location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !currentWeather ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="rounded-full bg-emerald-50 p-4 mb-4">
              <CloudSun className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Weather Data</h3>
            <p className="text-sm text-gray-500">
              Weather information is not available right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Conditions */}
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50 border-b border-emerald-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Current Conditions — {currentWeather.location}
                </CardTitle>
                <ConditionIcon condition={currentWeather.condition} />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-full bg-amber-100 p-3">
                    <ThermometerSun className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWeather.temperature}&deg;C</p>
                    <p className="text-xs text-gray-400">{currentWeather.condition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Humidity</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWeather.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-full bg-cyan-100 p-3">
                    <Wind className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Wind Speed</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWeather.wind_speed} km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-full bg-indigo-100 p-3">
                    <Umbrella className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rainfall</p>
                    <p className="text-2xl font-bold text-gray-900">{currentWeather.rainfall_mm} mm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast */}
          {currentWeather.forecast && currentWeather.forecast.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CloudSun className="h-5 w-5 text-emerald-600" />
                  7-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                  {currentWeather.forecast.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center rounded-lg bg-gray-50 p-4 text-center transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="my-2 text-2xl">
                        <ConditionIcon condition={day.condition} />
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-semibold text-gray-900">{day.temp_high}&deg;</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{day.temp_low}&deg;</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                        <Umbrella className="h-3 w-3" />
                        <span>{day.rainfall_chance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
              <span className="text-lg">⚠️</span>
              <p>
                <strong>Disclaimer:</strong> Weather Agent must never generate agronomic advice.
                This data is for informational purposes only. Consult a local agricultural
                extension officer for farm-specific recommendations.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
