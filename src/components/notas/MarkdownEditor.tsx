import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit, Save, X } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = 'Escribe tu nota en markdown...',
  className = '',
  readOnly = false,
}) => {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');
  // const [isFullscreen, setIsFullscreen] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          if (onSave) onSave();
          break;
        case 'Enter':
          e.preventDefault();
          if (onSave) onSave();
          break;
      }
    }
  }, [onSave]);

  // Función para modo pantalla completa (funcionalidad futura)
  // const toggleFullscreen = () => {
  //   setIsFullscreen(!isFullscreen);
  // };

  const renderToolbar = () => (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-400">
      <div className="flex items-center space-x-2">
        {readOnly ? (
          <span className="px-3 py-1.5 text-sm text-gray-600">
            <Eye className="h-4 w-4 inline mr-1" />
            Vista Previa
          </span>
        ) : (
          <>
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1.5 text-sm rounded ${
                mode === 'edit'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Edit className="h-4 w-4 inline mr-1" />
              Editar
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1.5 text-sm rounded ${
                mode === 'split'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Vista Dividida
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 text-sm rounded ${
                mode === 'preview'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Vista Previa
            </button>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {!readOnly && onSave && (
          <button
            onClick={onSave}
            className="btn-primary text-sm"
            disabled={!value.trim()}
          >
            <Save className="h-4 w-4 inline mr-1" />
            Guardar
          </button>
        )}
        {!readOnly && onCancel && (
          <button
            onClick={onCancel}
            className="btn-secondary text-sm"
          >
            <X className="h-4 w-4 inline mr-1" />
            Cancelar
          </button>
        )}
      </div>
    </div>
  );

  const renderEditor = () => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full h-full p-4 border-none resize-none focus:outline-none font-mono text-sm leading-relaxed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      style={{ minHeight: '400px' }}
    />
  );

  const renderPreview = () => (
    <div className="w-full h-full p-4 overflow-y-auto prose prose-sm max-w-none bg-white dark:bg-gray-700" style={{ minHeight: '400px' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 text-gray-700 dark:text-gray-300">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 text-gray-700 dark:text-gray-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-300 mb-3">
              {children}
            </blockquote>
          ),
          code: ({ children, ...props }) => {
            const isInline = !String(props.className || '').includes('language-');
            return isInline ? (
              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto mb-3">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 font-medium text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-700 px-3 py-2">{children}</td>
          ),
        }}
      >
        {value || '*Vista previa vacía*'}
      </ReactMarkdown>
    </div>
  );

  const containerClass = `
    ${className}
    relative
    border border-gray-200 rounded-lg overflow-hidden
  `;

  return (
    <div className={containerClass}>
      {renderToolbar()}

      <div className="flex h-full">
        {readOnly ? (
          <div className="w-full">
            {renderPreview()}
          </div>
        ) : (
          <>
            {mode === 'edit' && (
              <div className="w-full">
                {renderEditor()}
              </div>
            )}

            {mode === 'preview' && (
              <div className="w-full">
                {renderPreview()}
              </div>
            )}

            {mode === 'split' && (
              <>
                <div className="w-1/2 border-r border-gray-200">
                  {renderEditor()}
                </div>
                <div className="w-1/2">
                  {renderPreview()}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Ayuda de shortcuts */}
      {!readOnly && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
          Ctrl+S para guardar
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;