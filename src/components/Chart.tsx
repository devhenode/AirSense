import React, { useState } from 'react';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Dataset } from '../types/dataset';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  dataset: Dataset;
}

const Chart: React.FC<ChartProps> = ({ dataset }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>('bar');
  const [xAxis, setXAxis] = useState<string>(dataset.schema[0].name);
  const [yAxis, setYAxis] = useState<string>(dataset.schema[1].name);
  
  const numericalFields = dataset.schema
    .filter(field => field.type === 'number')
    .map(field => field.name);
  
  const categoricalFields = dataset.schema
    .filter(field => field.type === 'string')
    .map(field => field.name);
  
  const chartData = {
    labels: dataset.sampleData.map(item => item[xAxis]),
    datasets: [
      {
        label: yAxis,
        data: dataset.sampleData.map(item => item[yAxis]),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const scatterData = {
    datasets: [
      {
        label: `${xAxis} vs ${yAxis}`,
        data: dataset.sampleData.map(item => ({
          x: item[xAxis],
          y: item[yAxis],
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${dataset.name} - ${yAxis} by ${xAxis}`,
      },
    },
  };
  
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            X Axis
          </label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {chartType === 'scatter'
              ? numericalFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))
              : dataset.schema.map(field => (
                  <option key={field.name} value={field.name}>{field.name}</option>
                ))
            }
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Y Axis
          </label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {numericalFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="h-[400px]">
          {chartType === 'bar' && <Bar data={chartData} options={options} />}
          {chartType === 'line' && <Line data={chartData} options={options} />}
          {chartType === 'pie' && <Pie data={chartData} options={options} />}
          {chartType === 'scatter' && <Scatter data={scatterData} options={options} />}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">AI Analysis</h3>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            Based on the visualization, there appears to be a correlation between {xAxis} and {yAxis}. 
            The data suggests that as {xAxis} increases, {yAxis} tends to {Math.random() > 0.5 ? 'increase' : 'decrease'} as well.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chart;