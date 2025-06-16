// src/components/EnvironmentalDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Thermometer, Wind, AlertTriangle, MapPin, Droplets, RefreshCw, BarChart4, Calendar } from 'lucide-react';
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

interface EnvironmentalData {
  location: string;
  timestamp: string;
  temperature: number;
  pm25: number;
  pm10: number;
  humidity?: number;
  riskLevel: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

const EnvironmentalDashboard: React.FC = () => {  const [currentData, setCurrentData] = useState<EnvironmentalData | null>(null);
  const [historicalData, setHistoricalData] = useState<EnvironmentalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataView, setDataView] = useState<'chart' | 'table'>('chart');
  const [timeRange, setTimeRange] = useState<number>(7); // Days
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
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
    fetchData();
    // Set up polling every 30 minutes
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [timeRange]);
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
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center mx-auto"
          onClick={() => {
            setLoading(true);
            const fetchData = async () => {
              setIsRefreshing(true);
              try {
                const currentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/current`);
                const currentResult = await currentResponse.json();
                
                const historyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/history?days=${timeRange}`);
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
            fetchData();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }
    const chartData = {
    labels: historicalData.map(item => 
      new Date(item.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'PM2.5 (μg/m³)',
        data: historicalData.map(item => item.pm25),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'PM10 (μg/m³)',
        data: historicalData.map(item => item.pm10),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Temperature (°C)',
        data: historicalData.map(item => item.temperature),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };
  
  const barData = {
    labels: ['PM2.5', 'PM10', 'Temperature'],
    datasets: [
      {
        label: 'Current Levels',
        data: [currentData.pm25, currentData.pm10, currentData.temperature],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const getStayAdvice = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return {
          recommendation: 'Safe to stay outdoors',
          color: 'text-green-600 dark:text-green-400',
          description: 'Air quality is good and poses little or no risk.'
        };
      case 'Moderate':
        return {
          recommendation: 'Generally safe with precautions',
          color: 'text-yellow-600 dark:text-yellow-400',
          description: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.'
        };
      case 'High':
        return {
          recommendation: 'Limited outdoor activity recommended',
          color: 'text-orange-600 dark:text-orange-400',
          description: 'People with respiratory or heart disease, the elderly and children should reduce prolonged exertion.'
        };
      case 'Very High':
        return {
          recommendation: 'Stay indoors if possible',
          color: 'text-red-600 dark:text-red-400',
          description: 'Everyone should avoid all outdoor exertion.'
        };
      default:
        return {
          recommendation: 'Data unavailable',
          color: 'text-gray-600 dark:text-gray-400',
          description: 'Unable to provide recommendation due to insufficient data.'
        };
    }
  };
  
  const advice = getStayAdvice(currentData.riskLevel);
    return (
    <div>
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setDataView('chart')}
            className={`px-3 py-1.5 rounded-lg flex items-center ${dataView === 'chart' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            <BarChart4 className="w-4 h-4 mr-1.5" />
            Charts
          </button>
          <button
            onClick={() => setDataView('table')}
            className={`px-3 py-1.5 rounded-lg flex items-center ${dataView === 'table' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Details
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-1.5 px-3 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          
          <button 
            onClick={() => {
              setLoading(true);
              const fetchData = async () => {
                setIsRefreshing(true);
                try {
                  const currentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/current`);
                  const currentResult = await currentResponse.json();
                  
                  const historyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/environmental/history?days=${timeRange}`);
                  const historyResults = await historyResponse.json();
                  
                  setCurrentData(currentResult);
                  setHistoricalData(Array.isArray(historyResults) ? historyResults : []);
                  setError(null);
                } catch (error) {
                  console.error('Error refreshing data:', error);
                } finally {
                  setLoading(false);
                  setIsRefreshing(false);
                }
              };
              fetchData();
            }}
            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg" 
            title="Refresh Data"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Current Data Overview */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-xl font-bold">{currentData.location}</h2>
          {currentData.timestamp && (
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              Updated: {new Date(currentData.timestamp).toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Thermometer className="w-6 h-6 text-red-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Temperature</span>
              </div>
              <span className="text-xl font-semibold">{currentData.temperature}°C</span>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wind className="w-6 h-6 text-purple-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">PM2.5</span>
              </div>
              <span className="text-xl font-semibold">{currentData.pm25} μg/m³</span>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wind className="w-6 h-6 text-indigo-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">PM10</span>
              </div>
              <span className="text-xl font-semibold">{currentData.pm10} μg/m³</span>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Risk Level</span>
              </div>
              <span className="text-xl font-semibold">{currentData.riskLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
          <h3 className={`text-lg font-bold ${advice.color}`}>{advice.recommendation}</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-300">{advice.description}</p>
        </div>
      </div>
      
      {dataView === 'chart' ? (
        <>
          {/* Environmental Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Environmental Trends (Last {timeRange} {timeRange === 1 ? 'Day' : 'Days'})</h3>
            <div className="h-[300px]">
              <Line 
                data={chartData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      usePointStyle: true,
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Particulate Matter (μg/m³)'
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
                        text: 'Temperature (°C)'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Air Quality Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Current Measurements</h3>
            <div className="h-[300px]">
              <Bar 
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          const units = ['μg/m³', 'μg/m³', '°C'];
                          return `${label}: ${value} ${units[context.dataIndex]}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
          </div>
        </>
      ) : (
        /* Detailed View - Table */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">Historical Measurements</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PM2.5</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PM10</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Temp</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {historicalData.slice(0, 10).map((data, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/30' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(data.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.pm25} μg/m³</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.pm10} μg/m³</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.temperature}°C</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${data.riskLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          data.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          data.riskLevel === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`
                      }>
                        {data.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Map - Future Enhancement */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Location</h3>
        <div 
          ref={mapRef} 
          className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
          onClick={() => {
            if (currentData.coordinates) {
              window.open(`https://www.google.com/maps/search/?api=1&query=${currentData.coordinates.latitude},${currentData.coordinates.longitude}`, '_blank');
            }
          }}
        >
          <div className="text-center cursor-pointer hover:opacity-80">
            <MapPin className="w-8 h-8 mb-2 text-blue-500 mx-auto" />
            <p>View on Google Maps</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lat: {currentData.coordinates?.latitude}, Lon: {currentData.coordinates?.longitude}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
