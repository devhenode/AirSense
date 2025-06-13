import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Home, BarChart, Moon, Sun, Menu, X, CloudCog } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/datasets', label: 'Datasets', icon: <Database className="w-5 h-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart className="w-5 h-5" /> },
    { path: '/environmental', label: 'Environment', icon: <CloudCog className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile menu */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 z-50 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:w-64 lg:min-h-screen lg:block`}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold">MongoDB Explorer</h1>
          <button onClick={() => setIsMenuOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => { 
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    location.pathname === item.path ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium' : ''
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center">
              <button 
                onClick={toggleTheme}
                className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          MongoDB Data Explorer © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default Layout;