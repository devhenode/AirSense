// src/components/EnvironmentalDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Thermometer, AlertTriangle, MapPin, RefreshCw, BarChart4, Calendar, Search } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ForecastHourly {
  timestamp: string;
  temperature: number;
  humidity: number;
  conditions: string;
  icon: string;
}

interface ForecastDaily {
  timestamp: string;
  temperature_min: number;
  temperature_max: number;
  humidity: number;
  conditions: string;
  icon: string;
}

interface EnvironmentalData {
  location: string;
  timestamp: string;
  temperature: number;
  feels_like?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  pressure?: number;
  uv_index?: number;
  pm25: number;
  pm10: number;
  conditions?: string;
  icon?: string;
  riskLevel: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  hourlyForecast?: ForecastHourly[];
  dailyForecast?: ForecastDaily[];
  description?: string;
}

interface GeocodingResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

const EnvironmentalDashboard: React.FC = () => {
  const [currentData, setCurrentData] = useState<EnvironmentalData | null>(null);
  const [historicalData, setHistoricalData] = useState<EnvironmentalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataView, setDataView] = useState<'chart' | 'table' | 'forecast'>('chart');
  const [timeRange, setTimeRange] = useState<number>(7); // Days
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation && !selectedLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Could not get user location:", error);
        }
      );
    }
  }, []);
  
  useEffect(() => {
    if (selectedLocation) {
      fetchLocationData(selectedLocation.lat, selectedLocation.lon);
    } else {
      // Default to regular fetch if no location selected
      fetchData();
    }
  }, [selectedLocation, timeRange]);
  
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch current environmental data
      const currentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/current`);
      if (!currentResponse.ok) {
        throw new Error(`Failed to fetch current data: ${currentResponse.statusText}`);
      }
      const currentResult = await currentResponse.json();
      
      // Fetch historical data for charts
      const historyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/history?days=${timeRange}`);
      if (!historyResponse.ok) {
        throw new Error(`Failed to fetch historical data: ${historyResponse.statusText}`);
      }
      const historyResults = await historyResponse.json();
      
      setCurrentData(currentResult);
      setHistoricalData(Array.isArray(historyResults) ? historyResults : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
    const fetchLocationData = async (lat: number, lon: number) => {
    setIsRefreshing(true);
    try {
      console.log(`Fetching location data for lat: ${lat}, lon: ${lon}`);
      // Fetch location-specific environmental data
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/location?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch location data: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Location data received:", result);
      
      setCurrentData(result);
      setError(null);
      
      // Get historical data if available, otherwise use empty array
      setHistoricalData(Array.isArray(result.hourlyForecast) ? result.hourlyForecast.map((hour: any) => ({
        ...hour,
        pm25: result.pm25,
        pm10: result.pm10,
        location: result.location,
        riskLevel: result.riskLevel,
        coordinates: result.coordinates
      })) : []);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return;
    
    setIsSearching(true);
    try {
      // Use OpenWeather Geocoding API
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationSearch)}&limit=5&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_API_KEY'}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }
      
      const results = await response.json();
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching for location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const selectLocation = (result: GeocodingResult) => {
    setSelectedLocation({
      lat: result.lat,
      lon: result.lon
    });
    setSearchResults([]);
    setLocationSearch('');
  };
  
  // Handle when refresh button is clicked
  const handleRefresh = () => {
    if (selectedLocation) {
      fetchLocationData(selectedLocation.lat, selectedLocation.lon);
    } else {
      fetchData();
    }
  };
    
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Unable to load environmental data. {error || 'Please try again later.'}
        </p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'very high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Location search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-500" />
          Location
        </h2>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder="Search for a location..." 
              value={locationSearch} 
              onChange={(e) => setLocationSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          <button 
            onClick={handleLocationSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Search
          </button>
        </div>
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {searchResults.map((result, index) => (
                <li 
                  key={index} 
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => selectLocation(result)}
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {result.state ? `${result.state}, ` : ''}{result.country}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Current location display */}
        {currentData && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium">{currentData.location}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentData.coordinates?.latitude.toFixed(4)}, {currentData.coordinates?.longitude.toFixed(4)}
            </div>
          </div>
        )}
      </div>
      
      {/* Dashboard controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setDataView('chart')}
            className={`px-3 py-1.5 rounded flex items-center ${dataView === 'chart' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <BarChart4 className="w-4 h-4 mr-2" />
            Charts
          </button>
          <button 
            onClick={() => setDataView('table')}
            className={`px-3 py-1.5 rounded flex items-center ${dataView === 'table' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <table className="w-4 h-4 mr-2" />
            Details
          </button>
          <button 
            onClick={() => setDataView('forecast')}
            className={`px-3 py-1.5 rounded flex items-center ${dataView === 'forecast' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Forecast
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {dataView === 'chart' && (
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last week</option>
              <option value={30}>Last month</option>
            </select>
          )}
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Current conditions card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap justify-between">
          <div className="mb-4 pr-4">
            <h2 className="text-2xl font-bold mb-1">Current Conditions</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {formatDate(currentData.timestamp)}
            </p>
            
            <div className="mt-6 flex items-center">
              <div className="mr-6">
                <div className="flex items-center mb-2">
                  <Thermometer className="w-5 h-5 mr-2 text-red-500" />
                  <span className="text-3xl font-bold">{currentData.temperature?.toFixed(1)}°C</span>
                </div>
                {currentData.feels_like && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Feels like {currentData.feels_like?.toFixed(1)}°C
                  </p>
                )}
                <p className="text-gray-700 dark:text-gray-300 capitalize mt-1">
                  {currentData.conditions || 'No conditions data'}
                </p>
              </div>
              
              <div>
                {currentData.icon && (
                  <img 
                    src={`https://openweathermap.org/img/wn/${currentData.icon}@2x.png`} 
                    alt={currentData.conditions || 'Weather'} 
                    width={80} 
                    height={80} 
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6">
            {/* Air Quality */}
            <div className="mb-4">
              <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium mb-2">Air Quality</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">PM2.5</span>
                  <span className="font-medium">{currentData.pm25?.toFixed(1)} µg/m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">PM10</span>
                  <span className="font-medium">{currentData.pm10?.toFixed(1)} µg/m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Risk Level</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(currentData.riskLevel)}`}>
                    {currentData.riskLevel}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Other metrics */}
            <div className="mb-4">
              <h3 className="text-sm uppercase text-gray-500 dark:text-gray-400 font-medium mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Humidity</span>
                  <span className="font-medium">{currentData.humidity || 'N/A'}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Wind</span>
                  <span className="font-medium">{currentData.wind_speed?.toFixed(1) || 'N/A'} m/s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">UV Index</span>
                  <span className="font-medium">{currentData.uv_index?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk level advice */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">Health Advice</h3>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                {currentData.riskLevel === 'Low' && 'Air quality is considered satisfactory, and air pollution poses little or no risk.'}
                {currentData.riskLevel === 'Moderate' && 'Air quality is acceptable; however, there may be some concern for a small number of people who are unusually sensitive to air pollution.'}
                {currentData.riskLevel === 'High' && 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'}
                {currentData.riskLevel === 'Very High' && 'Health alert: everyone may experience more serious health effects. Avoid outdoor activities.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data visualization section */}
      {dataView === 'chart' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Historical Data</h2>
          <div className="h-80">
            {historicalData.length > 0 ? (
              <Line 
                data={{
                  labels: historicalData.map(item => {
                    try {
                      const date = new Date(item.timestamp);
                      return date.toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                      return 'Invalid date';
                    }
                  }),
                  datasets: [
                    {
                      label: 'Temperature (°C)',
                      data: historicalData.map(item => item.temperature),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      yAxisID: 'y',
                    },
                    {
                      label: 'Humidity (%)',
                      data: historicalData.map(item => item.humidity ?? 0),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      yAxisID: 'y1',
                    },
                    {
                      label: 'PM2.5 (µg/m³)',
                      data: historicalData.map(item => item.pm25),
                      borderColor: 'rgb(124, 58, 237)',
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      yAxisID: 'y2',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Temperature (°C)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'Humidity (%)'
                      }
                    },
                    y2: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'PM2.5 (µg/m³)'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No historical data available for selected time range</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Data table view */}
      {dataView === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Detailed Measurements</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metric</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Temperature</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.temperature?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">°C</td>
                  <td className="px-4 py-3 text-sm">
                    {currentData.temperature > 30 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</span>
                    ) : currentData.temperature < 0 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Low</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Normal</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Humidity</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.humidity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">%</td>
                  <td className="px-4 py-3 text-sm">                    {(currentData.humidity || 0) > 80 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">High</span>
                    ) : (currentData.humidity || 0) < 30 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Low</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Normal</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">PM2.5</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.pm25?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">µg/m³</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(currentData.riskLevel)}`}>
                      {currentData.pm25 <= 12 ? 'Good' : 
                        currentData.pm25 <= 35.4 ? 'Moderate' : 
                        currentData.pm25 <= 55.4 ? 'Unhealthy for Sensitive Groups' : 'Unhealthy'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">PM10</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.pm10?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">µg/m³</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(currentData.riskLevel)}`}>
                      {currentData.pm10 <= 54 ? 'Good' : 
                        currentData.pm10 <= 154 ? 'Moderate' : 
                        currentData.pm10 <= 254 ? 'Unhealthy for Sensitive Groups' : 'Unhealthy'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Wind Speed</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.wind_speed?.toFixed(1) || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">m/s</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {(currentData.wind_speed || 0) > 10 ? 'Strong' : (currentData.wind_speed || 0) > 5 ? 'Moderate' : 'Light'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">UV Index</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.uv_index?.toFixed(1) || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">index</td>
                  <td className="px-4 py-3 text-sm">                    {(currentData.uv_index || 0) > 7 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">High</span>
                    ) : (currentData.uv_index || 0) > 3 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Moderate</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Pressure</td>
                  <td className="px-4 py-3 text-sm font-medium">{currentData.pressure || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">hPa</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {(currentData.pressure || 0) > 1020 ? 'High' : (currentData.pressure || 0) < 1000 ? 'Low' : 'Normal'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Forecast tab */}
      {dataView === 'forecast' && currentData.dailyForecast && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">7-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {currentData.dailyForecast.map((day, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium mb-2">
                  {new Date(day.timestamp).toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                <div className="flex items-center justify-center mb-2">
                  {day.icon && (
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                      alt={day.conditions} 
                      width={50} 
                      height={50} 
                    />
                  )}
                </div>
                <p className="text-center capitalize text-sm mb-2">{day.conditions}</p>
                <div className="flex justify-between items-center">
                  <span className="text-red-500 dark:text-red-400 font-medium">
                    {day.temperature_max?.toFixed(0)}°
                  </span>
                  <span className="text-blue-500 dark:text-blue-400 font-medium">
                    {day.temperature_min?.toFixed(0)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Location map section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Location Map</h2>
        <div className="h-80 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" ref={mapRef}>
          {/* Map would be embedded here - for now using a link to OpenStreetMap */}
          <div className="h-full flex items-center justify-center">
            <a 
              href={`https://www.openstreetmap.org/#map=12/${currentData.coordinates?.latitude}/${currentData.coordinates?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open in OpenStreetMap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
