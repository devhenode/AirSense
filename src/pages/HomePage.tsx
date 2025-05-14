import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Search, Sparkles, Globe } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Database className="w-8 h-8 text-blue-500" />,
      title: 'Public Datasets',
      description: 'Access and explore curated public datasets from various domains.',
    },
    {
      icon: <Search className="w-8 h-8 text-purple-500" />,
      title: 'MongoDB Search',
      description: 'Leverage MongoDB\'s powerful search capabilities to find insights in your data.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-teal-500" />,
      title: 'AI Analysis',
      description: 'Generate insights and visualizations powered by AI to better understand your data.',
    },
    {
      icon: <Globe className="w-8 h-8 text-green-500" />,
      title: 'Google Integrations',
      description: 'Visualize geospatial data with Google Maps integration.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Explore, Analyze, and Visualize Data with MongoDB
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Select from our curated public datasets and gain new insights using MongoDB's search and vector search capabilities.
          </p>
          <button
            onClick={() => navigate('/datasets')}
            className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Explore Datasets
          </button>
        </div>
        
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-500 opacity-20 rounded-full"></div>
        <div className="absolute top-12 -right-8 w-32 h-32 bg-purple-500 opacity-20 rounded-full"></div>
      </section>

      {/* Features section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting started section */}
      <section className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold mr-4">1</span>
            <div>
              <h3 className="font-medium">Select a Dataset</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Browse our collection of public datasets and choose one that interests you.</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold mr-4">2</span>
            <div>
              <h3 className="font-medium">Explore the Data</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Use our interactive tools to explore and understand the dataset structure.</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold mr-4">3</span>
            <div>
              <h3 className="font-medium">Generate Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Let our AI tools help you discover patterns and insights in the data.</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold mr-4">4</span>
            <div>
              <h3 className="font-medium">Visualize Results</h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Create beautiful visualizations to better understand and share your findings.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => navigate('/datasets')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            Start Exploring
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;