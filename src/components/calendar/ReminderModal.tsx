import React, { useState, useEffect } from 'react';
import { X, AlignLeft, Bell, Trash2 } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminderData: {
    title: string;
    reminder_datetime: string;
    minutes_before: number;
    description?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  reminder?: {
    id: string;
    title: string;
    reminder_datetime: string;
    minutes_before: number;
    description?: string;
  } | null;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  reminder
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minutesBefore, setMinutesBefore] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (reminder) {
        // Edit mode
        setTitle(reminder.title);
        const reminderDate = new Date(reminder.reminder_datetime);
        setDate(reminderDate.toISOString().split('T')[0]);
        setTime(reminderDate.toTimeString().slice(0, 5));
        setMinutesBefore(reminder.minutes_before);
        setDescription(reminder.description || '');
      } else {
        // Create mode - set defaults
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().slice(0, 5));
        setMinutesBefore(0);
        setTitle('');
        setDescription('');
      }
      setError(null);
    }
  }, [isOpen, reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (!date || !time) {
      setError('La fecha y hora son obligatorias');
      return;
    }

    try {
      setIsLoading(true);

      const reminderDateTime = new Date(`${date}T${time}`);

      const reminderData = {
        title: title.trim(),
        reminder_datetime: reminderDateTime.toISOString(),
        minutes_before: minutesBefore,
        description: description.trim() || undefined
      };

      await onSave(reminderData);
      onClose();
    } catch (error: any) {
      console.error('Error saving reminder:', error);
      setError(error.message || 'Error al guardar el recordatorio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este recordatorio?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await onDelete();
      onClose();
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      setError(error.message || 'Error al eliminar el recordatorio');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {reminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Llamar al médico"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora *
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
          </div>

          {/* Minutes Before */}
          <div>
            <label htmlFor="minutesBefore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Bell className="h-4 w-4 inline mr-1" />
              Aviso de Telegram
            </label>
            <select
              id="minutesBefore"
              value={minutesBefore}
              onChange={(e) => setMinutesBefore(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={0}>A la hora exacta</option>
              <option value={5}>5 minutos antes</option>
              <option value={10}>10 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={120}>2 horas antes</option>
              <option value={1440}>1 día antes</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <AlignLeft className="h-4 w-4 inline mr-1" />
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añadir detalles adicionales..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {reminder && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{reminder ? 'Actualizar' : 'Crear'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;
