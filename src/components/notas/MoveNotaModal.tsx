import React, { useState, useEffect } from 'react';
import { X, FolderTree } from 'lucide-react';
import { Armario } from '../../types';

interface MoveNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (newParentId: string, newParentType: 'caja' | 'cajita') => Promise<void>;
  armarios: Armario[];
  currentParentId: string;
  currentParentType: 'caja' | 'cajita';
  notaTitle: string;
}

const MoveNotaModal: React.FC<MoveNotaModalProps> = ({
  isOpen,
  onClose,
  onMove,
  armarios,
  currentParentId,
  currentParentType,
  notaTitle
}) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation('');
      setError(null);
    }
  }, [isOpen]);

  const getCurrentLocationPath = () => {
    for (const armario of armarios) {
      for (const caja of armario.cajas) {
        if (currentParentType === 'caja' && caja.id === currentParentId) {
          return `${armario.nombre} → ${caja.nombre}`;
        }
        for (const cajita of caja.cajitas) {
          if (currentParentType === 'cajita' && cajita.id === currentParentId) {
            return `${armario.nombre} → ${caja.nombre} → ${cajita.nombre}`;
          }
        }
      }
    }
    return 'Ubicación desconocida';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) {
      setError('Debes seleccionar una nueva ubicación');
      return;
    }

    const [parentId, parentType] = selectedLocation.split('|');

    if (parentId === currentParentId && parentType === currentParentType) {
      setError('La nota ya está en esa ubicación');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onMove(parentId, parentType as 'caja' | 'cajita');
      onClose();
    } catch (error: any) {
      console.error('Error moviendo nota:', error);
      setError(error.response?.data?.detail || 'Error al mover la nota');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Mover Nota
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota a mover:
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {notaTitle}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación actual:
            </h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-400 flex items-center">
                <FolderTree className="h-4 w-4 mr-2" />
                {getCurrentLocationPath()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Nueva ubicación:
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
                {armarios.map((armario) => (
                  <div key={armario.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {armario.nombre}
                        {armario.is_default && (
                          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="pl-4">
                      {armario.cajas.map((caja) => (
                        <div key={caja.id}>
                          <label className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="location"
                              value={`${caja.id}|caja`}
                              checked={selectedLocation === `${caja.id}|caja`}
                              onChange={(e) => setSelectedLocation(e.target.value)}
                              className="mr-3"
                            />
                            <div
                              className="w-3 h-3 rounded mr-2 flex-shrink-0"
                              style={{ backgroundColor: caja.color }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {caja.nombre}
                            </span>
                          </label>
                          <div className="pl-6">
                            {caja.cajitas.map((cajita) => (
                              <label key={cajita.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="location"
                                  value={`${cajita.id}|cajita`}
                                  checked={selectedLocation === `${cajita.id}|cajita`}
                                  onChange={(e) => setSelectedLocation(e.target.value)}
                                  className="mr-3"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  📦 {cajita.nombre}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || !selectedLocation}
              >
                {isSubmitting ? 'Moviendo...' : 'Mover Nota'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MoveNotaModal;