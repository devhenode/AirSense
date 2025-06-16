import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Upload, AlertCircle } from 'lucide-react';
import DatasetCard from '../components/DatasetCard';
import type { Dataset } from '../types/dataset';

const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Use environment variable for API URL if available, otherwise default to localhost
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/datasets`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch datasets: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDatasets(data);
        } else {
          console.error('Expected an array of datasets but got:', data);
          setDatasets([]); // Set empty array as fallback
        }
      })
      .catch(err => {
        console.error('Error fetching datasets:', err);
        setDatasets([]); // Set empty array on error
      });
  }, []);

  const categories = Array.from(
    new Set(Array.isArray(datasets) ? datasets.map(dataset => dataset.category) : [])
  );

  const filteredDatasets = Array.isArray(datasets) ? datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? dataset.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  }) : [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check if file is CSV or other accepted formats
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json') && !file.name.endsWith('.xlsx')) {
      setUploadError('Please upload a CSV, JSON, or Excel file');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }

    setUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('dataset', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/upload-dataset`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload dataset');
      }

      const data = await response.json();
      
      // Refresh datasets list
      const datasetsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/datasets`);
      const newDatasets = await datasetsResponse.json();
      setDatasets(newDatasets);
      
      // Optionally navigate to the new dataset detail page
      if (data.id) {
        navigate(`/datasets/${data.id}`);
      }
    } catch (error) {
      console.error('Error uploading dataset:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload dataset');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Public Datasets</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Browse and explore our collection of curated public datasets
        </p>
      </div>

      {/* Search and filter controls */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={categoryFilter || ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dataset grid */}
      {filteredDatasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <DatasetCard 
              key={dataset.id} 
              dataset={dataset} 
              onClick={() => navigate(`/datasets/${dataset.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No datasets found matching your criteria</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter(null);
            }}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Upload own dataset section */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Have your own dataset?</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Upload your custom dataset to analyze it with our tools
            </p>
            {uploadError && (
              <div className="mt-2 flex items-center text-red-500">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="dataset-upload"
            />
            <label
              htmlFor="dataset-upload"
              className={`mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer ${
                uploading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Dataset
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetsPage;