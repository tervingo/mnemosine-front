import React, { useState, useEffect } from 'react';
import { X, Save, Archive, Edit } from 'lucide-react';
import { Armario, ArmarioCreate, ArmarioUpdate } from '../../types';

interface ArmarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (armarioData: ArmarioCreate | ArmarioUpdate) => Promise<void>;
  armario?: Armario; // Si se pasa, es para editar; si no, es para crear
  mode: 'create' | 'edit';
}

const ArmarioModal: React.FC<ArmarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  armario,
  mode
}) => {
  const [formData, setFormData] = useState<{
    nombre: string;
    descripcion: string;
    is_default: boolean;
  }>({
    nombre: '',
    descripcion: '',
    is_default: false
  });
  const [errors, setErrors] = useState<{
    nombre?: string;
    descripcion?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && armario) {
        setFormData({
          nombre: armario.nombre,
          descripcion: armario.descripcion || '',
          is_default: armario.is_default
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          is_default: false
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, armario]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.nombre.trim().length > 50) {
      newErrors.nombre = 'El nombre no puede tener más de 50 caracteres';
    }

    if (formData.descripcion && formData.descripcion.length > 200) {
      newErrors.descripcion = 'La descripción no puede tener más de 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'create') {
        await onSave({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          is_default: formData.is_default
        } as ArmarioCreate);
      } else {
        await onSave({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined
        } as ArmarioUpdate);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar el armario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      is_default: false
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Editar Armario' : 'Nuevo Armario';
  const submitText = isEdit ? 'Guardar Cambios' : 'Crear Armario';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {isEdit ? (
              <Edit className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            ) : (
              <Archive className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del armario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ej: Trabajo, Personal, Estudios..."
              maxLength={50}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Breve descripción del propósito de este armario..."
              rows={3}
              maxLength={200}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion}</p>
            )}
          </div>

          {/* Armario por defecto - solo para crear */}
          {mode === 'create' && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hacer este mi armario principal
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                El armario principal aparecerá expandido por defecto
              </p>
            </div>
          )}

          {/* Información adicional para edición */}
          {isEdit && armario?.is_default && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <Archive className="h-4 w-4 inline mr-1" />
                Este es tu armario principal
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Guardando...' : submitText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArmarioModal;