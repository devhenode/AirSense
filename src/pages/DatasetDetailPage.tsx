import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Info, BarChart4, Table, Map } from 'lucide-react';
import Chart from '../components/Chart';
import DataTable from '../components/DataTable';
import MapView from '../components/MapView';
import type { Dataset } from '../types/dataset';

const DatasetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'table' | 'visualize' | 'map'>('overview');
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/datasets/${id}`)
      .then(res => res.json())
      .then(data => {
        setDataset(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (!dataset && !loading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Dataset Not Found</h2>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          The dataset you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/datasets')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Datasets
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dataset...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with dataset info */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/datasets')}
          className="mb-4 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Datasets
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{dataset!.name}</h1>
            <div className="mt-2 flex items-center">
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                {dataset!.category}
              </span>
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                {dataset!.records.toLocaleString()} records
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={dataset!.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Source
            </a>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'table'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center">
              <Table className="w-4 h-4 mr-2" />
              Data Table
            </div>
          </button>
          <button
            onClick={() => setActiveTab('visualize')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'visualize'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center">
              <BarChart4 className="w-4 h-4 mr-2" />
              Visualize
            </div>
          </button>
          {dataset!.hasGeospatialData && (
            <button
              onClick={() => setActiveTab('map')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'map'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              } transition-colors`}
            >
              <div className="flex items-center">
                <Map className="w-4 h-4 mr-2" />
                Map View
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Dataset Overview</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">{dataset!.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Source</h3>
                <p className="text-gray-600 dark:text-gray-300">{dataset!.source}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Last Updated</h3>
                <p className="text-gray-600 dark:text-gray-300">{dataset!.lastUpdated}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Data Format</h3>
                <p className="text-gray-600 dark:text-gray-300">{dataset!.format}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">License</h3>
                <p className="text-gray-600 dark:text-gray-300">{dataset!.license}</p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-4">Schema Information</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Field</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dataset!.schema.map((field, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{field.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{field.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Data Table</h2>
            <DataTable dataset={dataset!} />
          </div>
        )}

        {activeTab === 'visualize' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Data Visualization</h2>
            <Chart dataset={dataset!} />
          </div>
        )}

        {activeTab === 'map' && dataset!.hasGeospatialData && (
          <div>
            <h2 className="text-xl font-bold mb-4">Geospatial View</h2>
            <MapView dataset={dataset!} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetDetailPage;