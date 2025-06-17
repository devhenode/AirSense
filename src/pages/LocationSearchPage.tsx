import { useState } from 'react';
import Layout from '../components/Layout';

// Define types for our location search
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Location {
  name: string;
  country: string;
  state: string;
  coordinates: Coordinates;
  displayName: string;
}

interface EnvironmentalData {
  location: string;
  coordinates: Coordinates;
  temperature: number;
  humidity: number;
  wind_speed: number;
  pm25: number | null;
  pm10: number | null;
  conditions: string | null;
}

interface AnalysisResult {
  location: string;
  coordinates: Coordinates | null;
  timestamp: string;
  analysis: string;
  source: string;
  hasRealData: boolean;
  environmentalData?: EnvironmentalData;
}

const LocationSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Search for locations
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/locations/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }
      const data = await response.json();
      setLocations(data.results || []);
    } catch (err) {
      console.error('Error searching for locations:', err);
      setError('Failed to search for locations. Please try again.');
      setLocations([]);
    } finally {
      setSearching(false);
    }
  };

  // Select a location and get analysis
  const handleSelectLocation = async (location: Location) => {
    setSelectedLocation(location);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/environmental/analyze-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: location.displayName,
          coordinates: location.coordinates
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze location');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error analyzing location:', err);
      setError('Failed to analyze this location. Please try again.');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <span className="mr-2">🌍</span>
            AirSense Location Search
          </h1>
          
          <p className="text-gray-600 mb-6">
            Search for any location in the world to get environmental and air quality insights.
          </p>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Search locations (city, region, country)"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                disabled={searching}
              />
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          
          {/* Search results */}
          {locations.length > 0 && (
            <div className="border rounded-lg shadow-sm mb-8 overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <h3 className="font-semibold">Search Results</h3>
              </div>
              <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {locations.map((location, index) => (
                  <li 
                    key={index}
                    onClick={() => handleSelectLocation(location)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition duration-150
                      ${selectedLocation?.displayName === location.displayName ? 'bg-blue-50' : ''}`}
                  >
                    <div className="font-medium">{location.displayName}</div>
                    <div className="text-sm text-gray-500">
                      Coordinates: {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Analyzing location...</span>
            </div>
          )}
          
          {/* Analysis results */}
          {analysis && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">{analysis.location}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Environmental data card */}
                {analysis.environmentalData && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4">
                      <h3 className="text-lg font-semibold mb-4">Current Conditions</h3>
                      
                      <div className="mb-4">
                        <div className="text-gray-500 text-sm">Temperature</div>
                        <div className="text-2xl font-semibold">
                          {analysis.environmentalData.temperature}°C
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-gray-500 text-sm">Humidity</div>
                          <div className="text-lg">
                            {analysis.environmentalData.humidity}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-sm">Wind</div>
                          <div className="text-lg">
                            {analysis.environmentalData.wind_speed} m/s
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-sm">PM2.5</div>
                          <div className="text-lg">
                            {analysis.environmentalData.pm25 || 'N/A'} μg/m³
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-sm">PM10</div>
                          <div className="text-lg">
                            {analysis.environmentalData.pm10 || 'N/A'} μg/m³
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Analysis card */}
                <div className={`bg-white rounded-lg shadow-md overflow-hidden ${analysis.environmentalData ? 'md:col-span-2' : 'md:col-span-3'}`}>
                  <div className="px-6 py-4">
                    <h3 className="text-lg font-semibold mb-1">
                      Environmental Analysis
                    </h3>
                    <div className="text-sm text-gray-500 mb-4">
                      by {analysis.source}
                    </div>
                    
                    <div className="prose max-w-none whitespace-pre-line">
                      {analysis.analysis}
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-400">
                      Analysis generated on {new Date(analysis.timestamp).toLocaleString()}
                      {analysis.hasRealData ? ' using real-time data' : ' using general location information'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LocationSearchPage;
