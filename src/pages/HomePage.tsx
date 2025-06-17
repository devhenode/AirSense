import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Activity, BarChart2, FileText } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="py-12 md:py-20 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <div className="flex items-center mb-6">
            <img
              src="/airsense-logo.png"
              alt="AirSense Logo"
              className="h-10 mr-3"
            />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AirSense
            </h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Monitor air quality and environmental conditions anywhere in the world
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Get real-time data on air quality, temperature, humidity, and more. Make informed decisions for your health and wellbeing based on accurate environmental information.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/environmental')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center transition-colors"
            >
              Start Monitoring <ChevronRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/datasets')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg flex items-center transition-colors"
            >
              Explore Datasets <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="md:w-1/2 md:pl-12">
          <img
            src="/dashboard-preview.png"
            alt="AirSense Dashboard Preview"
            className="rounded-lg shadow-lg w-full"
            onError={(e) => {
              // Fallback if the image doesn't exist
              e.currentTarget.src = "https://via.placeholder.com/800x500?text=AirSense+Dashboard";
            }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Comprehensive Environmental Monitoring
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Location-Based Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Search for any location worldwide and instantly access detailed environmental data and forecasts.
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Health Risk Assessment</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Receive personalized risk levels and health recommendations based on current environmental conditions.
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Advanced Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize trends, identify patterns, and analyze historical environmental data with interactive charts.
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Custom Dataset Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your own environmental datasets for in-depth analysis and visualization using our powerful tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;