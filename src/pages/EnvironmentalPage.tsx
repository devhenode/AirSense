// src/pages/EnvironmentalPage.tsx
import React from 'react';
import EnvironmentalDashboard from '../components/EnvironmentalDashboard';
import { CloudCog } from 'lucide-react';

const EnvironmentalPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <CloudCog className="w-8 h-8 mr-2 text-blue-500" />
          Airsense Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Real-time air quality monitoring, weather data, and environmental risk assessment
        </p>
      </div>

      <EnvironmentalDashboard />
    </div>
  );
};

export default EnvironmentalPage;
