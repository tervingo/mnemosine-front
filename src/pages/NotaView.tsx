import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
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
  EyeOff,
  Move,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Nota, NotaUpdate, Armario, Attachment } from '../types';
import MarkdownEditor from '../components/notas/MarkdownEditor';
import MoveNotaModal from '../components/notas/MoveNotaModal';
import AttachmentUpload from '../components/notas/AttachmentUpload';
import AttachmentList from '../components/notas/AttachmentList';
import { useAutoSave } from '../hooks/useAutoSave';

const NotaView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onRefresh } = useOutletContext<{ onRefresh?: () => void }>();

  const [nota, setNota] = useState<Nota | null>(null);
  const [armarios, setArmarios] = useState<Armario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

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

  // Ref para rastrear si ya se activó automáticamente el modo edición
  const autoEditActivated = useRef(false);

  // Función para guardar automáticamente (memoizada para evitar recreaciones)
  const autoSaveNota = useCallback(async (data: { titulo: string; contenido: string; etiquetas: string[] }) => {
    if (!id) return;

    try {
      const updateData: NotaUpdate = {
        titulo: data.titulo.trim() || 'Sin título',
        contenido: data.contenido,
        etiquetas: data.etiquetas
      };

      const updatedNota = await apiService.updateNota(id, updateData);
      setNota(updatedNota);

      // Mostrar indicador de guardado
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 3000); // Mostrar por 3 segundos
    } catch (error) {
      console.error('Error en autoguardado:', error);
    }
  }, [id]);

  // Configurar autoguardado (solo cuando está en modo edición)
  useAutoSave({
    data: editData,
    onSave: autoSaveNota,
    interval: 30000, // 30 segundos
    enabled: isEditing && !isSaving // Solo autoguardar en modo edición y si no está guardando manualmente
  });

  useEffect(() => {
    if (id) {
      loadNota(id);
      loadArmarios();
      // Reset el flag cuando cambia la nota
      autoEditActivated.current = false;
    }
  }, [id]);

  // Auto-activar modo edición si la nota es muy reciente (menos de 5 segundos)
  useEffect(() => {
    if (nota && !autoEditActivated.current) {
      const notaAge = Date.now() - new Date(nota.created_at).getTime();
      if (notaAge < 5000) { // 5 segundos
        setIsEditing(true);
        setPreviewMode(false);
        autoEditActivated.current = true; // Marcar como activado
      }
    }
  }, [nota]);

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

  const loadArmarios = async () => {
    try {
      const armariosData = await apiService.getArmarios();
      setArmarios(armariosData);
    } catch (error: any) {
      console.error('Error cargando armarios:', error);
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

      // Mostrar indicador de guardado
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 3000);
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

  const handleMove = async (newParentId: string, newParentType: 'caja' | 'cajita') => {
    if (!nota || !id) return;

    try {
      await apiService.moveNota(id, newParentId, newParentType);
      // Reload the nota to get updated parent info
      await loadNota(id);
      // Refresh the sidebar to show the updated structure
      if (onRefresh) {
        onRefresh();
      }
      setError(null);
    } catch (error: any) {
      console.error('Error moviendo nota:', error);
      throw error; // Let the modal handle the error display
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

  const handleAttachmentUpload = (attachment: Attachment) => {
    if (nota) {
      setNota({
        ...nota,
        attachments: [...nota.attachments, attachment]
      });
    }
  };

  const handleAttachmentDelete = (attachmentId: string) => {
    if (nota) {
      setNota({
        ...nota,
        attachments: nota.attachments.filter(a => a.id !== attachmentId)
      });
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
      <div className="bg-white dark:bg-gray-400 border-b border-gray-200 dark:border-gray-600 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-800 rounded-md transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.titulo}
                  onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 w-full"
                  placeholder="Título de la nota"
                />
              ) : (
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{nota.titulo}</h1>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-200 space-y-1 sm:space-y-0">
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

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Indicador de guardado */}
            {showSavedIndicator && (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-700 text-sm animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guardado</span>
              </div>
            )}

            {!isEditing && (
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 rounded-md transition-colors"
                title={previewMode ? 'Ver código markdown' : 'Ver vista previa'}
              >
                {previewMode ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            )}

            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn-secondary flex items-center space-x-1 sm:space-x-2 text-sm"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editData.titulo.trim()}
                  className="btn-primary flex items-center space-x-1 sm:space-x-2 text-sm"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="btn-secondary flex items-center space-x-1 sm:space-x-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => setIsMoveModalOpen(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 rounded-md transition-colors"
                  title="Mover nota"
                >
                  <Move className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 rounded-md transition-colors"
                  title="Eliminar nota"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
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
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Markdown content - scrollable */}
        <div className="flex-1 overflow-y-auto">
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
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {nota.contenido || 'Esta nota está vacía...'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments section - fixed at bottom with own scroll if needed */}
        {nota && (nota.attachments?.length > 0 || isEditing) && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 max-h-[40vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Attachment list */}
              {nota.attachments && nota.attachments.length > 0 && (
                <AttachmentList
                  notaId={nota.id}
                  attachments={nota.attachments}
                  onDeleteSuccess={handleAttachmentDelete}
                  readonly={!isEditing}
                />
              )}

              {/* Upload component (only in edit mode) */}
              {isEditing && (
                <AttachmentUpload
                  notaId={nota.id}
                  onUploadSuccess={handleAttachmentUpload}
                  currentAttachmentCount={nota.attachments?.length || 0}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Move Nota Modal */}
      {nota && (
        <MoveNotaModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          onMove={handleMove}
          armarios={armarios}
          currentParentId={nota.parent_id}
          currentParentType={nota.parent_type}
          notaTitle={nota.titulo}
        />
      )}
    </div>
  );
};

export default NotaView;