import React, { useState } from 'react';
import { Calendar, FileText, Database, ChevronRight, Globe, Link, Table, MapPin } from 'lucide-react';
import { Dataset } from '../types/dataset';

interface DatasetCardProps {
  dataset: Dataset;
  onClick: () => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format the last updated date
  const formattedDate = (() => {
    try {
      const date = new Date(dataset.lastUpdated);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dataset.lastUpdated;
    }
  })();
  
  // Determine card gradient based on category
  const getGradient = (category: string) => {
    switch (category.toLowerCase()) {
      case 'environmental':
        return 'from-green-500 to-teal-500';
      case 'analysis':
        return 'from-blue-500 to-indigo-500';
      case 'user uploaded':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-blue-500 to-purple-500';
    }
  };
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      style={{ transform: isHovered ? 'translateY(-2px)' : 'none' }}
    >
      <div className={`h-3 bg-gradient-to-r ${getGradient(dataset.category)}`}></div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold">{dataset.name}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${dataset.category.toLowerCase() === 'environmental' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
              dataset.category.toLowerCase() === 'analysis' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 
              dataset.category.toLowerCase() === 'user uploaded' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
          >
            {dataset.category}
          </span>
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
          {dataset.description}
        </p>
        
        <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Database className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {dataset.records.toLocaleString()} records
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {formattedDate}
          </div>
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1.5 flex-shrink-0" />
            {dataset.format}
          </div>
          {dataset.source && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-1.5 flex-shrink-0" />
              {dataset.source}
            </div>
          )}
          {dataset.hasGeospatialData && (
            <div className="flex items-center col-span-2">
              <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
              Contains geospatial data
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Table className="w-4 h-4 mr-1.5 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {dataset.schema?.length || 0} fields
            </span>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
            View Details 
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;