import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService, handleApiError } from '../services/api';
import { Armario, Nota } from '../types';
import { Plus, FileText, Clock, Folder } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [armarios, setArmarios] = useState<Armario[]>([]);
  const [recentNotes, setRecentNotes] = useState<Nota[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [armariosData] = await Promise.all([
          apiService.getArmarios()
        ]);

        setArmarios(armariosData);

        // Obtener notas recientes (últimas 5)
        const allNotes: Nota[] = [];
        for (const armario of armariosData) {
          for (const caja of armario.cajas) {
            allNotes.push(...caja.notas);
            for (const cajita of caja.cajitas) {
              allNotes.push(...cajita.notas);
            }
          }
        }

        // Ordenar por fecha de actualización y tomar las 5 más recientes
        const sortedNotes = allNotes
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5);

        setRecentNotes(sortedNotes);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        setError(handleApiError(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getTotalStats = () => {
    let totalNotas = 0;
    let totalCajas = 0;
    let totalCajitas = 0;

    armarios.forEach(armario => {
      totalCajas += armario.cajas.length;
      armario.cajas.forEach(caja => {
        totalNotas += caja.notas.length;
        totalCajitas += caja.cajitas.length;
        caja.cajitas.forEach(cajita => {
          totalNotas += cajita.notas.length;
        });
      });
    });

    return { totalNotas, totalCajas, totalCajitas };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center space-x-4 mb-2">
          <img
            src="/images/Mysselhoj.jpg"
            alt="Mnemosine Logo"
            className="h-16 w-auto rounded-lg object-cover"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            ¡Hola, {user?.username}! 👋
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Bienvenido a tu espacio de notas organizadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total Notas</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalNotas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Armarios</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{armarios.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-bold">C</span>
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Cajas</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalCajas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-orange-600 rounded flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-bold">c</span>
              </div>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Cajitas</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.totalCajitas}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Notas Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Notas Recientes
              </h2>
              <Link
                to="/buscar"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Ver todas
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentNotes.length > 0 ? (
              recentNotes.map((nota) => (
                <Link
                  key={nota.id}
                  to={`/nota/${nota.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {nota.titulo}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {nota.contenido.substring(0, 100)}...
                      </p>
                      {nota.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {nota.etiquetas.slice(0, 3).map((etiqueta) => (
                            <span
                              key={etiqueta}
                              className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded"
                            >
                              {etiqueta}
                            </span>
                          ))}
                          {nota.etiquetas.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{nota.etiquetas.length - 3} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(nota.updated_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay notas recientes</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Crea tu primera nota para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Armarios */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <Folder className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Mis Armarios
              </h2>
              <Link
                to="/armarios/nuevo"
                className="btn-primary text-sm flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo</span>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {armarios.length > 0 ? (
              armarios.map((armario) => (
                <Link
                  key={armario.id}
                  to={`/armario/${armario.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Folder className="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {armario.nombre}
                          {armario.is_default && (
                            <span className="ml-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                              Principal
                            </span>
                          )}
                        </p>
                        {armario.descripcion && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {armario.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {armario.cajas.length} cajas
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(armario.updated_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay armarios creados</p>
                <Link
                  to="/armarios/nuevo"
                  className="text-sm text-primary-600 hover:text-primary-500 mt-2 inline-block"
                >
                  Crear tu primer armario
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;