import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DatasetsPage from './pages/DatasetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import EnvironmentalPage from './pages/EnvironmentalPage';
import LocationSearchPage from './pages/LocationSearchPage';

function App() {
  const basePath = import.meta.env.BASE_URL || '/';

  return (
    <ThemeProvider>
      <Router basename={basePath}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/datasets/:id" element={<DatasetDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/environmental" element={<EnvironmentalPage />} />
            <Route path="/location-search" element={<LocationSearchPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;