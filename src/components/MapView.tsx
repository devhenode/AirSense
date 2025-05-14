import React, { useEffect, useState } from 'react';
import { Dataset } from '../types/dataset';

interface MapViewProps {
  dataset: Dataset;
}

const MapView: React.FC<MapViewProps> = ({ dataset }) => {
  const [latField, setLatField] = useState<string>('');
  const [lngField, setLngField] = useState<string>('');
  const [labelField, setLabelField] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find likely latitude and longitude fields
    const findFieldByNames = (possibilities: string[]) => {
      return dataset.schema.find(field => 
        possibilities.some(name => 
          field.name.toLowerCase().includes(name.toLowerCase())
        )
      )?.name || '';
    };

    setLatField(findFieldByNames(['lat', 'latitude']));
    setLngField(findFieldByNames(['lng', 'lon', 'longitude']));
    setLabelField(findFieldByNames(['name', 'title', 'id']));
    
    // Simulate loading the map
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [dataset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Latitude Field
          </label>
          <select
            value={latField}
            onChange={(e) => setLatField(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select field</option>
            {dataset.schema
              .filter(field => field.type === 'number')
              .map(field => (
                <option key={field.name} value={field.name}>{field.name}</option>
              ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Longitude Field
          </label>
          <select
            value={lngField}
            onChange={(e) => setLngField(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select field</option>
            {dataset.schema
              .filter(field => field.type === 'number')
              .map(field => (
                <option key={field.name} value={field.name}>{field.name}</option>
              ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Label Field
          </label>
          <select
            value={labelField}
            onChange={(e) => setLabelField(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Select field</option>
            {dataset.schema.map(field => (
              <option key={field.name} value={field.name}>{field.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="relative bg-gray-100 dark:bg-gray-700 h-96 rounded-lg overflow-hidden">
        {/* Google Maps would be integrated here */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">Google Maps Integration</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              (Showing {dataset.sampleData.length} locations from the dataset)
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Note: Google Maps integration would display the geospatial data points on an interactive map.</p>
      </div>
    </div>
  );
};

export default MapView;