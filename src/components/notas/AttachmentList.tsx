import React, { useState } from 'react';
import { File, Image, Video, Link as LinkIcon, ExternalLink, Trash2, Youtube } from 'lucide-react';
import { Attachment } from '../../types';
import { apiService } from '../../services/api';

interface AttachmentListProps {
  notaId: string;
  attachments: Attachment[];
  onDeleteSuccess: (attachmentId: string) => void;
  readonly?: boolean;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  notaId,
  attachments,
  onDeleteSuccess,
  readonly = false
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    setError(null);
    setDeletingId(attachmentId);

    try {
      await apiService.deleteAttachment(notaId, attachmentId);
      onDeleteSuccess(attachmentId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar el archivo');
    } finally {
      setDeletingId(null);
    }
  };

  const getAttachmentIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'youtube':
        return <Youtube className="h-5 w-5 text-red-500" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-green-500" />;
      case 'document':
        return <File className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return url;
  };

  const renderAttachmentPreview = (attachment: Attachment) => {
    switch (attachment.file_type) {
      case 'image':
        return (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <img
              src={attachment.url}
              alt={attachment.filename}
              className="w-full h-48 object-cover rounded-md group-hover:opacity-90 transition-opacity"
            />
          </a>
        );

      case 'youtube':
        return (
          <div className="relative w-full aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(attachment.url)}
              title={attachment.filename}
              className="w-full h-full rounded-md"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );

      case 'video':
        return (
          <video
            src={attachment.url}
            controls
            className="w-full rounded-md"
          >
            Tu navegador no soporta el elemento de video.
          </video>
        );

      case 'link':
      case 'document':
        return (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <div className="flex-shrink-0">
              {getAttachmentIcon(attachment.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {attachment.filename}
              </p>
              {attachment.size && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.size)}
                </p>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
          </a>
        );

      default:
        return null;
    }
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Archivos adjuntos ({attachments.length})
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Preview */}
            <div className="p-3">
              {renderAttachmentPreview(attachment)}
            </div>

            {/* Delete button */}
            {!readonly && (
              <button
                onClick={() => handleDelete(attachment.id)}
                disabled={deletingId === attachment.id}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Eliminar archivo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* File info footer for images and videos */}
            {(attachment.file_type === 'image' || attachment.file_type === 'video') && (
              <div className="px-3 pb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate">{attachment.filename}</span>
                {attachment.size && (
                  <span className="ml-2 flex-shrink-0">{formatFileSize(attachment.size)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList;
