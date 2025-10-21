import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { Search, User, LogOut, Plus, Box, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onNewNote?: () => void;
  onNewCaja?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onNewNote, onNewCaja }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y navegación */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mnemosine</span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link
                to="/armarios"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Mis Armarios
              </Link>
              <Link
                to="/buscar"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Buscar
              </Link>
            </nav>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Buscar notas..."
              />
            </form>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {onNewCaja && (
                <button
                  onClick={onNewCaja}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Box className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Caja</span>
                </button>
              )}
              {onNewNote && (
                <button
                  onClick={onNewNote}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Nota</span>
                </button>
              )}
            </div>

            {/* Toggle de Dark Mode */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
              title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Menú del usuario */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 p-2 rounded-md transition-colors">
                <User className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium">{user?.username}</span>
              </button>

              {/* Dropdown del usuario */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium">{user?.username}</div>
                    <div className="text-gray-500 dark:text-gray-400">{user?.email}</div>
                  </div>
                  <Link
                    to="/perfil"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Mi Perfil
                  </Link>
                  <Link
                    to="/configuracion"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Configuración
                  </Link>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;