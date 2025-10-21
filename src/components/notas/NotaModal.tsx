import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Armario, NotaCreate } from '../../types';
import MarkdownEditor from './MarkdownEditor';

interface NotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nota: NotaCreate) => Promise<void>;
  armarios: Armario[];
}

const NotaModal: React.FC<NotaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  armarios
}) => {
  const [formData, setFormData] = useState<{
    titulo: string;
    contenido: string;
    etiquetas: string[];
    parent_id: string;
    parent_type: 'caja' | 'cajita';
  }>({
    titulo: '',
    contenido: '',
    etiquetas: [],
    parent_id: '',
    parent_type: 'caja'
  });

  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        titulo: '',
        contenido: '',
        etiquetas: [],
        parent_id: '',
        parent_type: 'caja'
      });
      setEtiquetaInput('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (!formData.parent_id) {
      setError('Debes seleccionar dónde crear la nota');
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        titulo: formData.titulo.trim(),
        contenido: formData.contenido,
        etiquetas: formData.etiquetas,
        parent_id: formData.parent_id,
        parent_type: formData.parent_type
      });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Error al crear la nota');
    } finally {
      setIsLoading(false);
    }
  };

  const addEtiqueta = () => {
    const etiqueta = etiquetaInput.trim();
    if (etiqueta && !formData.etiquetas.includes(etiqueta)) {
      setFormData(prev => ({
        ...prev,
        etiquetas: [...prev.etiquetas, etiqueta]
      }));
      setEtiquetaInput('');
    }
  };

  const removeEtiqueta = (etiqueta: string) => {
    setFormData(prev => ({
      ...prev,
      etiquetas: prev.etiquetas.filter(e => e !== etiqueta)
    }));
  };

  const handleEtiquetaKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEtiqueta();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nueva Nota</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
          {/* Form Fields */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                className="input-field"
                placeholder="Título de la nota"
                required
              />
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación *
              </label>
              <select
                id="ubicacion"
                value={formData.parent_id ? `${formData.parent_id}|${formData.parent_type}` : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [parentId, parentType] = e.target.value.split('|');
                    setFormData(prev => ({
                      ...prev,
                      parent_id: parentId,
                      parent_type: parentType as 'caja' | 'cajita'
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      parent_id: '',
                      parent_type: 'caja'
                    }));
                  }
                }}
                className="input-field"
                required
              >
                <option value="">Selecciona dónde crear la nota</option>
                {armarios.map(armario => (
                  <optgroup key={armario.id} label={`📁 ${armario.nombre}`}>
                    {armario.cajas.map(caja => (
                      <React.Fragment key={caja.id}>
                        <option value={`${caja.id}|caja`}>
                          📦 {caja.nombre}
                        </option>
                        {caja.cajitas.map(cajita => (
                          <option key={cajita.id} value={`${cajita.id}|cajita`}>
                            📦📦 {cajita.nombre}
                          </option>
                        ))}
                      </React.Fragment>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Etiquetas */}
            <div>
              <label htmlFor="etiquetas" className="block text-sm font-medium text-gray-700 mb-1">
                Etiquetas
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={etiquetaInput}
                  onChange={(e) => setEtiquetaInput(e.target.value)}
                  onKeyPress={handleEtiquetaKeyPress}
                  className="input-field flex-1"
                  placeholder="Agregar etiqueta"
                />
                <button
                  type="button"
                  onClick={addEtiqueta}
                  className="btn-secondary"
                >
                  Agregar
                </button>
              </div>
              {formData.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.etiquetas.map(etiqueta => (
                    <span
                      key={etiqueta}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      {etiqueta}
                      <button
                        type="button"
                        onClick={() => removeEtiqueta(etiqueta)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <MarkdownEditor
              value={formData.contenido}
              onChange={(value) => setFormData(prev => ({ ...prev, contenido: value }))}
              placeholder="Escribe el contenido de tu nota en markdown..."
              className="h-full border-none"
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Guardando...' : 'Crear Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotaModal;