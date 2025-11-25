import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { Attachment } from '../../types';

interface AttachmentUploadProps {
  notaId: string;
  onUploadSuccess: (attachment: Attachment) => void;
  currentAttachmentCount: number;
  maxAttachments?: number;
}

const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  notaId,
  onUploadSuccess,
  currentAttachmentCount,
  maxAttachments = 3
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo excede el límite de 20MB');
      return;
    }

    // Validar cantidad de archivos
    if (currentAttachmentCount >= maxAttachments) {
      setError(`Máximo ${maxAttachments} archivos por nota`);
      return;
    }

    try {
      setIsUploading(true);
      const result = await apiService.uploadAttachment(notaId, file);
      onUploadSuccess(result.attachment);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!linkUrl.trim()) {
      setError('Debes ingresar una URL');
      return;
    }

    // Validar cantidad de archivos
    if (currentAttachmentCount >= maxAttachments) {
      setError(`Máximo ${maxAttachments} archivos por nota`);
      return;
    }

    try {
      setIsUploading(true);
      const linkType = linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')
        ? 'youtube'
        : 'link';

      const result = await apiService.uploadLink(notaId, linkUrl.trim(), linkType);
      onUploadSuccess(result.attachment);
      setLinkUrl('');
      setShowLinkInput(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al añadir el enlace');
    } finally {
      setIsUploading(false);
    }
  };

  const canAddMore = currentAttachmentCount < maxAttachments;

  return (
    <div className="space-y-3">
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload buttons */}
      {canAddMore && (
        <div className="flex gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Subiendo...' : 'Subir archivo'}
          </button>

          {/* Link button */}
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LinkIcon className="h-4 w-4" />
            Añadir enlace
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          />
        </div>
      )}

      {/* Link input form */}
      {showLinkInput && canAddMore && (
        <form onSubmit={handleLinkSubmit} className="flex gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://ejemplo.com o https://youtube.com/..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isUploading}
          />
          <button
            type="submit"
            disabled={isUploading}
            className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Añadir
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            disabled={isUploading}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Max attachments reached message */}
      {!canAddMore && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Máximo de {maxAttachments} archivos alcanzado
        </p>
      )}
    </div>
  );
};

export default AttachmentUpload;
