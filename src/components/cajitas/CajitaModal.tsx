import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CajitaCreate } from '../../types';

interface CajitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cajitaData: CajitaCreate) => Promise<void>;
  cajaId: string;
  cajaNombre?: string;
}

const CajitaModal: React.FC<CajitaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cajaId,
  cajaNombre
}) => {
  const [formData, setFormData] = useState<CajitaCreate>({
    nombre: '',
    descripcion: '',
    caja_id: cajaId
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: '',
        descripcion: '',
        caja_id: cajaId
      });
      setError(null);
    }
  }, [isOpen, cajaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Error creando cajita:', error);
      setError(error.response?.data?.detail || 'Error al crear la cajita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Nueva Cajita
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caja destino
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {cajaNombre || 'Caja seleccionada'}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="input-field w-full"
              placeholder="Nombre de la cajita"
              required
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Descripción opcional de la cajita"
            />
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
              disabled={isSubmitting || !formData.nombre.trim()}
            >
              {isSubmitting ? 'Creando...' : 'Crear Cajita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CajitaModal;