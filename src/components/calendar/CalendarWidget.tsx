import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { googleCalendarService, CalendarEvent } from '../../services/googleCalendar';

interface CalendarWidgetProps {
  className?: string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [tomorrowEvents, setTomorrowEvents] = useState<CalendarEvent[]>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Days of the week in Spanish
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

      const [monthEvents, todayEventsList, tomorrowEventsList] = await Promise.all([
        googleCalendarService.getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth()),
        googleCalendarService.getEventsForToday(),
        googleCalendarService.getEventsForTomorrow()
      ]);

      console.log('Events loaded:', {
        monthEvents: monthEvents.length,
        todayEvents: todayEventsList.length,
        tomorrowEvents: tomorrowEventsList.length
      });

      setEvents(monthEvents);
      setTodayEvents(todayEventsList);
      setTomorrowEvents(tomorrowEventsList);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setError('Error al cargar los eventos del calendario');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

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
      setTodayEvents([]);
      setTomorrowEvents([]);
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

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
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
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    } else if (eventCount === 1) {
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  const EventItem: React.FC<{ event: CalendarEvent }> = ({ event }) => (
    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {/* Week days header */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date ? (
              <div
                className={`
                  w-full h-full flex items-center justify-center text-sm rounded-md transition-colors font-semibold
                  ${isToday(date)
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : getDayColorClass(date)
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

      {/* Today's Events */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Hoy ({new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})
        </h4>
        <div className="space-y-1.5">
          {todayEvents.length > 0 ? (
            todayEvents.map(event => (
              <EventItem key={event.id} event={event} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-xs italic">No hay eventos para hoy</p>
          )}
        </div>
      </div>

      {/* Tomorrow's Events */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Mañana ({(() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          })()})
        </h4>
        <div className="space-y-1.5">
          {tomorrowEvents.length > 0 ? (
            tomorrowEvents.map(event => (
              <EventItem key={event.id} event={event} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-xs italic">No hay eventos para mañana</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;