import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlignLeft, Trash2 } from 'lucide-react';
import { CalendarEvent } from '../../services/googleCalendar';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  event?: CalendarEvent | null;
  initialDate?: Date;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [enableReminder, setEnableReminder] = useState(false);
  const [minutesBefore, setMinutesBefore] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        setTitle(event.summary || '');
        setDescription(event.description || '');
        setLocation(event.location || '');

        const startDateTime = event.start.dateTime || event.start.date;
        const endDateTime = event.end.dateTime || event.end.date;

        if (event.start.date) {
          // All-day event
          setIsAllDay(true);
          setStartDate(event.start.date);
          setEndDate(event.end.date || event.start.date);
          setStartTime('');
          setEndTime('');
        } else if (startDateTime) {
          // Timed event
          setIsAllDay(false);
          const start = new Date(startDateTime);
          setStartDate(start.toISOString().split('T')[0]);
          setStartTime(start.toTimeString().slice(0, 5));

          if (endDateTime) {
            const end = new Date(endDateTime);
            setEndDate(end.toISOString().split('T')[0]);
            setEndTime(end.toTimeString().slice(0, 5));
          }
        }
      } else {
        // Create mode
        const now = initialDate || new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

        setTitle('');
        setDescription('');
        setLocation('');
        setStartDate(dateStr);
        setStartTime(timeStr);
        setEndDate(dateStr);
        setEndTime(endTimeStr);
        setIsAllDay(false);
      }
      setError(null);
    }
  }, [isOpen, event, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (!startDate) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    try {
      setIsLoading(true);

      let eventData;

      if (isAllDay) {
        eventData = {
          summary: title,
          description: description || undefined,
          location: location || undefined,
          start: { date: startDate },
          end: { date: endDate || startDate }
        };
      } else {
        if (!startTime) {
          setError('La hora de inicio es obligatoria');
          return;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = endDate && endTime
          ? new Date(`${endDate}T${endTime}`)
          : new Date(startDateTime.getTime() + 60 * 60 * 1000);

        eventData = {
          summary: title,
          description: description || undefined,
          location: location || undefined,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() }
        };
      }

      await onSave(eventData);
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      setError(error.message || 'Error al guardar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este evento?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await onDelete();
      onClose();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error.message || 'Error al eliminar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {event ? 'Editar Evento' : 'Nuevo Evento'}
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
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Añadir título"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allDay" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Todo el día
            </label>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            {!isAllDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hora de inicio *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            )}
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            {!isAllDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Ubicación
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Añadir ubicación"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <AlignLeft className="h-4 w-4 inline mr-1" />
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añadir descripción"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Telegram Reminder */}
          {!isAllDay && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="enableReminder"
                  checked={enableReminder}
                  onChange={(e) => setEnableReminder(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableReminder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📱 Enviar recordatorio a Telegram
                </label>
              </div>

              {enableReminder && (
                <div className="ml-6">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Tiempo de anticipación:
                  </label>
                  <select
                    value={minutesBefore}
                    onChange={(e) => setMinutesBefore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value={0}>A la hora del evento</option>
                    <option value={5}>5 minutos antes</option>
                    <option value={10}>10 minutos antes</option>
                    <option value={15}>15 minutos antes</option>
                    <option value={30}>30 minutos antes</option>
                    <option value={60}>1 hora antes</option>
                    <option value={120}>2 horas antes</option>
                    <option value={1440}>1 día antes</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
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
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
