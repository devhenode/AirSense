// src/components/EnvironmentalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Thermometer, Wind, AlertTriangle, MapPin } from 'lucide-react';

interface EnvironmentalData {
  location: string;
  timestamp: string;
  temperature: number;
  pm25: number;
  pm10: number;
  riskLevel: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const EnvironmentalDashboard: React.FC = () => {
  const [currentData, setCurrentData] = useState<EnvironmentalData | null>(null);
  const [historicalData, setHistoricalData] = useState<EnvironmentalData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current environmental data
        const currentResponse = await fetch('http://localhost:5000/api/environmental/current');
        const currentResult = await currentResponse.json();
        
        // Fetch historical data for charts
        const historyResponse = await fetch('http://localhost:5000/api/environmental/history?days=7');
        const historyResults = await historyResponse.json();
        
        setCurrentData(currentResult);
        setHistoricalData(historyResults);
      } catch (error) {
        console.error('Error fetching environmental data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Set up polling every 30 minutes
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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
          Unable to load environmental data. Please try again later.
        </p>
      </div>
    );
  }
  
  const chartData = {
    labels: historicalData.map(item => 
      new Date(item.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'PM2.5',
        data: historicalData.map(item => item.pm25),
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      },
      {
        label: 'Temperature',
        data: historicalData.map(item => item.temperature),
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
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
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-xl font-bold">{currentData.location}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Environmental Trends (Last 7 Days)</h3>
        <div className="h-[300px]">
          <Line 
            data={chartData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDashboard;
