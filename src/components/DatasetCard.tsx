import React from 'react';
import { Calendar, FileText, Database } from 'lucide-react';
import { Dataset } from '../types/dataset';

interface DatasetCardProps {
  dataset: Dataset;
  onClick: () => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold">{dataset.name}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {dataset.category}
          </span>
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
          {dataset.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Database className="w-4 h-4 mr-1" />
            {dataset.records.toLocaleString()} records
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {dataset.lastUpdated}
          </div>
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            {dataset.format}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;