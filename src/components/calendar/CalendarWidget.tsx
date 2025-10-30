import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, ExternalLink, Plus, Bell, Trash2 } from 'lucide-react';
import { googleCalendarService, CalendarEvent } from '../../services/googleCalendar';
import { apiService } from '../../services/api';
import EventModal from './EventModal';
import ReminderModal from './ReminderModal';

interface CalendarWidgetProps {
  className?: string;
}

type ViewMode = 'monthly' | 'weekly';

interface InternalReminder {
  id: string;
  title: string;
  reminder_datetime: string;
  reminder_time: string;
  minutes_before: number;
  description?: string;
  sent: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<InternalReminder[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<InternalReminder | null>(null);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | undefined>(undefined);

  // Days of the week in Spanish (starting with Monday)
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Months in Spanish
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const loadCalendarData = useCallback(async () => {
    try {
      console.log('loadCalendarData called');
      setIsLoading(true);
      setError(null);

      const monthEvents = await googleCalendarService.getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());

      console.log('Events loaded:', {
        monthEvents: monthEvents.length
      });

      setEvents(monthEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Error al cargar los eventos del calendario');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  const loadReminders = useCallback(async () => {
    try {
      const remindersData = await apiService.getInternalReminders();
      setReminders(remindersData);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  }, []);

  useEffect(() => {
    const initializeGoogleCalendar = async () => {
      try {
        await googleCalendarService.initializeAuth();
        const signedIn = googleCalendarService.isSignedIn();
        console.log('After initialization, signed in:', signedIn);
        setIsSignedIn(signedIn);
      } catch (error) {
        console.error('Error initializing Google Calendar:', error);
        setError('Error al inicializar Google Calendar');
      }
    };

    initializeGoogleCalendar();
  }, []);

  useEffect(() => {
    console.log('isSignedIn changed to:', isSignedIn);
    if (isSignedIn) {
      console.log('Calling loadCalendarData because isSignedIn is true');
      loadCalendarData();
    }
  }, [currentDate, isSignedIn, loadCalendarData]);

  // Load reminders on mount and when they change
  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const success = await googleCalendarService.signIn();
      setIsSignedIn(success);
      if (!success) {
        setError('No se pudo conectar con Google Calendar. Verifica que hayas autorizado el acceso.');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(`Error al conectar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleCalendarService.signOut();
      setIsSignedIn(false);
      setEvents([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    // Convert Sunday (0) to 6, and shift others down by 1
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventCountForDay = (date: Date): number => {
    const count = events.filter(event => {
      const eventStart = event.start.dateTime || event.start.date || '';
      const eventDate = new Date(eventStart);

      // For all-day events (date only), compare just the date
      // For timed events, compare the date part
      const eventDateStr = eventDate.toDateString();
      const targetDateStr = date.toDateString();

      const matches = eventDateStr === targetDateStr;

      // Debug logging for October 28
      if (date.getDate() === 28 && date.getMonth() === 9) {
        console.log('Oct 28 event check:', {
          eventSummary: event.summary,
          eventStart,
          eventDateStr,
          targetDateStr,
          matches
        });
      }

      return matches;
    }).length;

    // Debug logging for October 28
    if (date.getDate() === 28 && date.getMonth() === 9) {
      console.log('Oct 28 total count:', count);
      console.log('All events:', events);
    }

    return count;
  };

  const getDayColorClass = (date: Date): string => {
    const eventCount = getEventCountForDay(date);

    if (eventCount === 0) {
      return 'bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-200';
    } else if (eventCount === 1) {
      return 'bg-orange-100 dark:bg-orange-500/60 text-orange-800 dark:text-orange-200';
    } else {
      return 'bg-red-100 dark:bg-red-500/60 text-red-800 dark:text-red-200';
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getCurrentWeekDates = (): Date[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Adjust for Monday start (0 = Sunday becomes 6, others shift down by 1)
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const weekDates: Date[] = [];

    // Get Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - adjustedDayOfWeek);

    // Get all 7 days of the week starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatEventTime = (event: CalendarEvent): string => {
    return googleCalendarService.formatEventTime(event);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setEventModalInitialDate(selectedDate);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventModalInitialDate(undefined);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      let createdEvent;

      if (selectedEvent) {
        // Update existing event
        createdEvent = await googleCalendarService.updateEvent(selectedEvent.id, eventData);

        // Handle reminder update/deletion
        if (eventData.enableReminder) {
          // Update or create reminder
          try {
            const existingReminder = await apiService.getReminderByEventId(selectedEvent.id);

            if (existingReminder) {
              // Update existing reminder
              await apiService.updateReminder(selectedEvent.id, {
                event_title: eventData.summary,
                event_start: eventData.start.dateTime || eventData.start.date,
                minutes_before: eventData.minutesBefore || 15
              });
            } else {
              // Create new reminder
              await apiService.createReminder({
                event_id: selectedEvent.id,
                event_title: eventData.summary,
                event_start: eventData.start.dateTime || eventData.start.date,
                minutes_before: eventData.minutesBefore || 15
              });
            }
          } catch (error) {
            console.error('Error managing reminder:', error);
          }
        } else {
          // Delete reminder if exists
          try {
            const existingReminder = await apiService.getReminderByEventId(selectedEvent.id);
            if (existingReminder) {
              await apiService.deleteReminder(existingReminder.id);
            }
          } catch (error) {
            console.error('Error deleting reminder:', error);
          }
        }
      } else {
        // Create new event
        createdEvent = await googleCalendarService.createEvent(eventData);

        // Create reminder if enabled
        if (eventData.enableReminder && createdEvent?.id) {
          try {
            await apiService.createReminder({
              event_id: createdEvent.id,
              event_title: eventData.summary,
              event_start: eventData.start.dateTime || eventData.start.date,
              minutes_before: eventData.minutesBefore || 15
            });
          } catch (error) {
            console.error('Error creating reminder:', error);
          }
        }
      }

      // Reload events
      await loadCalendarData();
    } catch (error) {
      console.error('Error saving event:', error);
      throw error;
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      // Delete the Google Calendar event
      await googleCalendarService.deleteEvent(selectedEvent.id);

      // Delete associated reminder if exists
      try {
        const existingReminder = await apiService.getReminderByEventId(selectedEvent.id);
        if (existingReminder) {
          await apiService.deleteReminder(existingReminder.id);
        }
      } catch (error) {
        console.error('Error deleting reminder:', error);
      }

      // Reload events
      await loadCalendarData();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  // Reminder handlers
  const handleNewReminder = () => {
    setSelectedReminder(null);
    setIsReminderModalOpen(true);
  };

  const handleEditReminder = (reminder: InternalReminder) => {
    setSelectedReminder(reminder);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = async (reminderData: any) => {
    try {
      if (selectedReminder) {
        // Update existing reminder
        await apiService.updateInternalReminder(selectedReminder.id, reminderData);
      } else {
        // Create new reminder
        await apiService.createInternalReminder(reminderData);
      }
      // Reload reminders
      await loadReminders();
      setIsReminderModalOpen(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este recordatorio?');
    if (!confirmed) return;

    try {
      await apiService.deleteInternalReminder(reminderId);
      await loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      alert('Error al eliminar el recordatorio');
    }
  };

  const EventItem: React.FC<{ event: CalendarEvent }> = ({ event }) => (
    <div
      onClick={() => handleEditEvent(event)}
      className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.summary}</h4>
          <div className="flex items-center mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatEventTime(event)}</span>
          </div>
          {event.location && (
            <div className="flex items-center mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isSignedIn) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Calendario de Google
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Conecta tu cuenta de Google Calendar para ver tus eventos
          </p>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{isLoading ? 'Conectando...' : 'Conectar Google Calendar'}</span>
          </button>
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={handleNewEvent}
            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-md transition-colors"
            title="Crear evento"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-1"
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* View Selector Tabs */}
      <div className="flex space-x-1 mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            viewMode === 'monthly'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            viewMode === 'weekly'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Semana
        </button>
      </div>

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-6">
            {/* Week days header */}
            {weekDays.map(day => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <div
                    onClick={() => setSelectedDate(date)}
                    className={`
                      w-full h-full flex items-center justify-center text-xs sm:text-sm rounded-sm sm:rounded-md transition-colors font-semibold cursor-pointer hover:ring-2 hover:ring-gray-400
                      ${isToday(date)
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : getDayColorClass(date)
                      }
                      ${selectedDate && date.toDateString() === selectedDate.toDateString()
                        ? 'ring-2 ring-purple-500'
                        : ''
                      }
                    `}
                  >
                    {date.getDate()}
                  </div>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Day's Events */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {selectedDate.toDateString() === new Date().toDateString()
                ? `Hoy (${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
                : selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </h4>
            <div className="space-y-1.5">
              {(() => {
                const selectedDayEvents = events.filter(event => {
                  const eventStart = event.start.dateTime || event.start.date || '';
                  const eventDate = new Date(eventStart);
                  return eventDate.toDateString() === selectedDate.toDateString();
                });

                return selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(event => (
                    <EventItem key={event.id} event={event} />
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-xs italic">No hay eventos para este día</p>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Semana actual
          </h4>
          <div className="space-y-2">
            {getCurrentWeekDates().map(date => {
              const dayEvents = events.filter(event => {
                const eventStart = event.start.dateTime || event.start.date || '';
                const eventDate = new Date(eventStart);
                return eventDate.toDateString() === date.toDateString();
              });

              return (
                <div
                  key={date.toISOString()}
                  className={`p-2 rounded-lg border ${
                    isToday(date)
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      dayEvents.length === 0
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : dayEvents.length === 1
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}>
                      {dayEvents.length}
                    </span>
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={() => handleEditEvent(event)}
                          className="text-xs text-gray-700 dark:text-gray-300 flex items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded transition-colors"
                        >
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          <span className="font-medium">{formatEventTime(event)}</span>
                          <span className="mx-1">-</span>
                          <span className="truncate">{event.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}

      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Recordatorios
            </h3>
            <button
              onClick={handleNewReminder}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </button>
          </div>
          <div className="space-y-2">
            {reminders.map(reminder => {
              const reminderDate = new Date(reminder.reminder_datetime);
              const now = new Date();
              const isPast = reminderDate < now;

              return (
                <div
                  key={reminder.id}
                  className={`p-3 rounded-lg border ${
                    isPast
                      ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600 opacity-60'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleEditReminder(reminder)}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reminder.title}
                      </h4>
                      <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {reminderDate.toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {reminder.minutes_before > 0 && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                            (Aviso: {reminder.minutes_before} min antes)
                          </span>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="ml-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Button to create reminder if no reminders exist */}
      {reminders.length === 0 && (
        <div className="mt-6">
          <button
            onClick={handleNewReminder}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
          >
            <Bell className="h-5 w-5 mr-2" />
            Crear recordatorio
          </button>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        event={selectedEvent}
        initialDate={eventModalInitialDate}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setSelectedReminder(null);
        }}
        onSave={handleSaveReminder}
        reminder={selectedReminder}
      />
    </div>
  );
};

export default CalendarWidget;