import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit,
  Save,
  X,
  Calendar,
  Tag,
  ArrowLeft,
  Trash2,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiService } from '../services/api';
import { Nota, NotaUpdate } from '../types';
import MarkdownEditor from '../components/notas/MarkdownEditor';

const NotaView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [nota, setNota] = useState<Nota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(true);

  // Estado para el formulario de edición
  const [editData, setEditData] = useState<{
    titulo: string;
    contenido: string;
    etiquetas: string[];
  }>({
    titulo: '',
    contenido: '',
    etiquetas: []
  });

  const [etiquetaInput, setEtiquetaInput] = useState('');

  useEffect(() => {
    if (id) {
      loadNota(id);
    }
  }, [id]);

  const loadNota = async (notaId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const notaData = await apiService.getNota(notaId);
      setNota(notaData);

      // Inicializar datos de edición
      setEditData({
        titulo: notaData.titulo,
        contenido: notaData.contenido,
        etiquetas: [...notaData.etiquetas]
      });
    } catch (error: any) {
      console.error('Error cargando nota:', error);
      setError('Error al cargar la nota');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleCancelEdit = () => {
    if (nota) {
      setEditData({
        titulo: nota.titulo,
        contenido: nota.contenido,
        etiquetas: [...nota.etiquetas]
      });
    }
    setIsEditing(false);
    setPreviewMode(true);
  };

  const handleSave = async () => {
    if (!nota || !id) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData: NotaUpdate = {
        titulo: editData.titulo.trim(),
        contenido: editData.contenido,
        etiquetas: editData.etiquetas
      };

      const updatedNota = await apiService.updateNota(id, updateData);
      setNota(updatedNota);
      setIsEditing(false);
      setPreviewMode(true);
    } catch (error: any) {
      console.error('Error guardando nota:', error);
      setError('Error al guardar la nota');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nota || !id) return;

    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.'
    );

    if (confirmDelete) {
      try {
        await apiService.deleteNota(id);
        navigate('/');
      } catch (error: any) {
        console.error('Error eliminando nota:', error);
        setError('Error al eliminar la nota');
      }
    }
  };

  const addEtiqueta = () => {
    const etiqueta = etiquetaInput.trim();
    if (etiqueta && !editData.etiquetas.includes(etiqueta)) {
      setEditData(prev => ({
        ...prev,
        etiquetas: [...prev.etiquetas, etiqueta]
      }));
      setEtiquetaInput('');
    }
  };

  const removeEtiqueta = (etiqueta: string) => {
    setEditData(prev => ({
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (error || !nota) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {error || 'Nota no encontrada'}
        </h2>
        <p className="text-gray-600 mb-4">
          {error ? 'Hubo un problema al cargar la nota.' : 'La nota que buscas no existe o ha sido eliminada.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-400 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-800 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.titulo}
                  onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
                  placeholder="Título de la nota"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{nota.titulo}</h1>
              )}
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-200">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Creado: {formatDate(nota.created_at)}</span>
                </div>
                {nota.updated_at !== nota.created_at && (
                  <div className="flex items-center space-x-1">
                    <Edit className="h-4 w-4" />
                    <span>Modificado: {formatDate(nota.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                title={previewMode ? 'Ver código markdown' : 'Ver vista previa'}
              >
                {previewMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            )}

            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editData.titulo.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                  title="Eliminar nota"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Etiquetas */}
        <div className="mt-4">
          {isEditing ? (
            <div>
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
              {editData.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editData.etiquetas.map(etiqueta => (
                    <span
                      key={etiqueta}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      <Tag className="h-3 w-3" />
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
          ) : (
            nota.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nota.etiquetas.map(etiqueta => (
                  <span
                    key={etiqueta}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {etiqueta}
                  </span>
                ))}
              </div>
            )
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <MarkdownEditor
            value={editData.contenido}
            onChange={(value) => setEditData(prev => ({ ...prev, contenido: value }))}
            placeholder="Escribe el contenido de tu nota en markdown..."
            className="h-full border-none"
          />
        ) : (
          <div className="h-full">
            {previewMode ? (
              <MarkdownEditor
                value={nota.contenido}
                onChange={() => {}} // No onChange in read-only mode
                readOnly={true}
                className="h-full border-none"
              />
            ) : (
              <div className="h-full p-4 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                  {nota.contenido || 'Esta nota está vacía...'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotaView;