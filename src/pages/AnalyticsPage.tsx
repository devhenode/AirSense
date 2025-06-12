import React, { useState, useEffect } from 'react';
import { FileQuestion, SearchCheck, Database, Wand2 } from 'lucide-react';
import type { Dataset } from '../types/dataset';

const AnalyticsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/datasets')
      .then(res => res.json())
      .then(data => setDatasets(data));
  }, []);

  const handleAnalyze = () => {
    if (!selectedDataset || !query) return;
    
    setIsAnalyzing(true);
    setResults(null);
    
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults(`Analysis results for query: "${query}" on dataset ${selectedDataset}`);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI-Powered Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Ask questions about your data and get AI-generated insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left panel - Dataset selection */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-500" />
              Select Dataset
            </h2>
            
            <div className="space-y-2 mt-4">
              {datasets.map(dataset => (
                <div 
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDataset === dataset.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650'
                  }`}
                >
                  <h3 className="font-medium">{dataset.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dataset.records.toLocaleString()} records</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Query and results */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileQuestion className="w-5 h-5 mr-2 text-purple-500" />
              Ask a Question
            </h2>
            
            <div className="mt-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g.: What is the trend of carbon emissions over the last decade? or Show me the correlation between population density and air quality."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-32"
                disabled={!selectedDataset}
              />
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedDataset || !query || isAnalyzing}
                  className={`flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                    !selectedDataset || !query || isAnalyzing
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {results && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <SearchCheck className="w-5 h-5 mr-2 text-teal-500" />
                  Analysis Results
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300">{results}</p>
                  
                  {/* This would be where we'd display charts, tables, etc. */}
                  <div className="mt-4 h-64 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      [Visualization placeholder]
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;