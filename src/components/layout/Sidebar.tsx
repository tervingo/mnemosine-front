import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Armario } from '../../types';
import { apiService } from '../../services/api';
import {
  Archive,
  Box,
  Package,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Star
} from 'lucide-react';

interface SidebarProps {
  armarios: Armario[];
  onCreateCaja?: (armarioId: string) => void;
  onCreateCajita?: (cajaId: string) => void;
  onCreateNota?: (parentId: string, parentType: 'caja' | 'cajita') => void;
  onEditArmario?: (armario: Armario) => void;
  onDeleteArmario?: (armarioId: string) => void;
  onCreateArmario?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  armarios,
  onCreateCaja,
  onCreateCajita,
  onCreateNota,
  onEditArmario,
  onDeleteArmario,
  onCreateArmario,
  isOpen = false,
  onClose,
  onRefresh
}) => {
  const location = useLocation();
  const [expandedArmarios, setExpandedArmarios] = React.useState<Set<string>>(new Set());
  const [expandedCajas, setExpandedCajas] = React.useState<Set<string>>(new Set());

  // Initialize expansion state to show all items expanded by default
  React.useEffect(() => {
    const allArmarioIds = new Set(armarios.map(armario => armario.id));
    const allCajaIds = new Set(armarios.flatMap(armario => armario.cajas.map(caja => caja.id)));

    setExpandedArmarios(allArmarioIds);
    setExpandedCajas(allCajaIds);
  }, [armarios]);

  const toggleArmario = (armarioId: string) => {
    const newExpanded = new Set(expandedArmarios);
    if (newExpanded.has(armarioId)) {
      newExpanded.delete(armarioId);
    } else {
      newExpanded.add(armarioId);
    }
    setExpandedArmarios(newExpanded);
  };

  const toggleCaja = (cajaId: string) => {
    const newExpanded = new Set(expandedCajas);
    if (newExpanded.has(cajaId)) {
      newExpanded.delete(cajaId);
    } else {
      newExpanded.add(cajaId);
    }
    setExpandedCajas(newExpanded);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleDeleteCaja = async (cajaId: string) => {
    const caja = armarios.flatMap(a => a.cajas).find(c => c.id === cajaId);
    if (!caja) return;

    const totalContent = caja.notas.length + caja.cajitas.reduce((acc, cajita) => acc + cajita.notas.length, 0);

    if (totalContent > 0) {
      alert('No se puede eliminar una caja que contiene notas o cajitas. Elimina primero todo su contenido.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar la caja "${caja.nombre}"? Esta acción no se puede deshacer.`
    );

    if (confirmDelete) {
      try {
        await apiService.deleteCaja(cajaId);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error: any) {
        console.error('Error eliminando caja:', error);
        alert(error.response?.data?.detail || 'Error al eliminar la caja');
      }
    }
  };

  const handleDeleteCajita = async (cajitaId: string) => {
    const cajita = armarios.flatMap(a => a.cajas).flatMap(c => c.cajitas).find(c => c.id === cajitaId);
    if (!cajita) return;

    if (cajita.notas.length > 0) {
      alert('No se puede eliminar una cajita que contiene notas. Elimina primero todas las notas.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar la cajita "${cajita.nombre}"? Esta acción no se puede deshacer.`
    );

    if (confirmDelete) {
      try {
        await apiService.deleteCajita(cajitaId);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error: any) {
        console.error('Error eliminando cajita:', error);
        alert(error.response?.data?.detail || 'Error al eliminar la cajita');
      }
    }
  };

  const handleDeleteArmario = async (armarioId: string) => {
    const armario = armarios.find(a => a.id === armarioId);
    if (!armario) return;

    if (armario.cajas.length > 0) {
      alert('No se puede eliminar un armario que contiene cajas. Elimina primero todas las cajas.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el armario "${armario.nombre}"? Esta acción no se puede deshacer.`
    );

    if (confirmDelete) {
      try {
        await apiService.deleteArmario(armarioId);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error: any) {
        console.error('Error eliminando armario:', error);
        alert(error.response?.data?.detail || 'Error al eliminar el armario');
      }
    }
  };

  const handleSetDefaultArmario = async (armarioId: string) => {
    const armario = armarios.find(a => a.id === armarioId);
    if (!armario) return;

    const confirmSetDefault = window.confirm(
      `¿Quieres establecer "${armario.nombre}" como tu armario principal?`
    );

    if (confirmSetDefault) {
      try {
        await apiService.setDefaultArmario(armarioId);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error: any) {
        console.error('Error estableciendo armario como principal:', error);
        alert(error.response?.data?.detail || 'Error al establecer el armario como principal');
      }
    }
  };

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-50
      transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      transition-transform duration-300 ease-in-out
      w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto
    `}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Organización</h2>
          <div className="flex items-center space-x-1">
            {onCreateArmario && (
              <button
                onClick={onCreateArmario}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
                title="Crear nuevo armario"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="space-y-1">
          {armarios.map((armario) => (
            <div key={armario.id} className="space-y-1">
              {/* Armario */}
              <div className="flex items-center group">
                <button
                  onClick={() => toggleArmario(armario.id)}
                  className="flex items-center flex-1 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {expandedArmarios.has(armario.id) ? (
                    <ChevronDown className="h-4 w-4 mr-1 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1 text-gray-400" />
                  )}
                  <Archive className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="truncate text-gray-700 dark:text-gray-200">{armario.nombre}</span>
                  {armario.is_default && (
                    <span className="ml-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </button>

                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  {onCreateCaja && (
                    <button
                      onClick={() => onCreateCaja(armario.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Crear nueva caja"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                  {onEditArmario && (
                    <button
                      onClick={() => onEditArmario(armario)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Editar armario"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  )}
                  {!armario.is_default && (
                    <button
                      onClick={() => handleSetDefaultArmario(armario.id)}
                      className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                      title="Establecer como principal"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  {onDeleteArmario && !armario.is_default && (
                    <button
                      onClick={() => handleDeleteArmario(armario.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Eliminar armario"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cajas del armario */}
              {expandedArmarios.has(armario.id) && (
                <div className="ml-4 space-y-1">
                  {armario.cajas.map((caja) => (
                    <div key={caja.id} className="space-y-1">
                      {/* Caja */}
                      <div className="flex items-center group">
                        <button
                          onClick={() => toggleCaja(caja.id)}
                          className="flex items-center flex-1 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          {expandedCajas.has(caja.id) ? (
                            <ChevronDown className="h-3 w-3 mr-1 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                          )}
                          <Box
                            className="h-3 w-3 mr-2"
                            style={{ color: caja.color }}
                          />
                          <span className="truncate">{caja.nombre}</span>
                          <span className="ml-auto text-xs text-gray-400">
                            {caja.notas.length + caja.cajitas.reduce((acc, cajita) => acc + cajita.notas.length, 0)}
                          </span>
                        </button>

                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          {onCreateCajita && (
                            <button
                              onClick={() => onCreateCajita(caja.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Crear nueva cajita"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                          {onCreateNota && (
                            <button
                              onClick={() => onCreateNota(caja.id, 'caja')}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Crear nueva nota"
                            >
                              <FileText className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCaja(caja.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Eliminar caja"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Notas directas de la caja */}
                      {expandedCajas.has(caja.id) && caja.notas.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {caja.notas.map((nota) => (
                            <Link
                              key={nota.id}
                              to={`/nota/${nota.id}`}
                              onClick={handleLinkClick}
                              className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors ${
                                isActive(`/nota/${nota.id}`)
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <FileText className="h-3 w-3 mr-2 text-gray-400" />
                              <span className="truncate">{nota.titulo}</span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Cajitas de la caja */}
                      {expandedCajas.has(caja.id) && (
                        <div className="ml-4 space-y-1">
                          {caja.cajitas.map((cajita) => (
                            <div key={cajita.id} className="space-y-1">
                              {/* Cajita */}
                              <div className="flex items-center group">
                                <Link
                                  to={`/cajita/${cajita.id}`}
                                  onClick={handleLinkClick}
                                  className={`flex items-center flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                                    isActive(`/cajita/${cajita.id}`)
                                      ? 'bg-primary-50 text-primary-700'
                                      : 'text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  <Package className="h-3 w-3 mr-2 text-gray-400" />
                                  <span className="truncate">{cajita.nombre}</span>
                                  <span className="ml-auto text-xs text-gray-400">
                                    {cajita.notas.length}
                                  </span>
                                </Link>

                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                  {onCreateNota && (
                                    <button
                                      onClick={() => onCreateNota(cajita.id, 'cajita')}
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                      title="Crear nueva nota"
                                    >
                                      <FileText className="h-3 w-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteCajita(cajita.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                    title="Eliminar cajita"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Notas de la cajita */}
                              <div className="ml-4 space-y-1">
                                {cajita.notas.map((nota) => (
                                  <Link
                                    key={nota.id}
                                    to={`/nota/${nota.id}`}
                                    onClick={handleLinkClick}
                                    className={`flex items-center px-2 py-1 text-xs rounded-md transition-colors ${
                                      isActive(`/nota/${nota.id}`)
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <FileText className="h-3 w-3 mr-2 text-gray-400" />
                                    <span className="truncate">{nota.titulo}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;