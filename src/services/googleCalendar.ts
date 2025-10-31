export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenClient: any = null;
  private readonly STORAGE_KEY = 'google_calendar_token';
  private readonly TOKEN_EXPIRY_KEY = 'google_calendar_token_expiry';
  private autoRefreshInterval: NodeJS.Timeout | null = null;

  async initializeAuth(): Promise<void> {
    await Promise.all([
      this.loadGoogleIdentityServices(),
      this.loadGoogleAPI()
    ]);

    // Try to restore token from localStorage
    this.restoreToken();

    // Start auto-refresh check
    this.startAutoRefresh();
  }

  private restoreToken(): void {
    const storedToken = localStorage.getItem(this.STORAGE_KEY);
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (storedToken && expiryTime) {
      const expiry = parseInt(expiryTime, 10);
      const now = Date.now();

      // Check if token is still valid (with 5 minute buffer)
      if (expiry > now + 5 * 60 * 1000) {
        console.log('Restoring saved Google Calendar token');
        this.accessToken = storedToken;

        // Set token on gapi client if available
        if (window.gapi && window.gapi.client) {
          window.gapi.client.setToken({ access_token: storedToken });
          console.log('Token set on GAPI client');
        }
      } else {
        console.log('Stored token expired, clearing');
        this.clearToken();
      }
    }
  }

  private saveToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    const expiryTime = Date.now() + expiresIn * 1000;

    localStorage.setItem(this.STORAGE_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    console.log('Token saved to localStorage');
  }

  private clearToken(): void {
    this.accessToken = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  private startAutoRefresh(): void {
    // Check every 5 minutes if token needs refresh
    this.autoRefreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  private async checkAndRefreshToken(): Promise<void> {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return;

    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();

    // If token expires in less than 10 minutes, try to refresh silently
    if (expiry - now < 10 * 60 * 1000) {
      console.log('Token expiring soon, attempting silent refresh...');
      try {
        await this.silentRefresh();
      } catch (error) {
        console.log('Silent refresh failed, user will need to sign in again');
        this.clearToken();
      }
    }
  }

  private async silentRefresh(): Promise<void> {
    if (!this.tokenClient) {
      // Initialize token client if not already done
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google || !window.google.accounts) {
        throw new Error('Cannot refresh: Google Identity Services not available');
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar',
        callback: (response: any) => {
          if (!response.error) {
            const expiresIn = response.expires_in || 3600;
            this.saveToken(response.access_token, expiresIn);
            window.gapi.client.setToken({ access_token: response.access_token });
            console.log('Token refreshed successfully');
          }
        },
      });
    }

    // Request new token silently (without showing UI if possible)
    this.tokenClient.requestAccessToken({ prompt: '' });
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Loading Google Identity Services...');

      if (typeof window.google !== 'undefined' && window.google.accounts) {
        console.log('Google Identity Services already loaded');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services loaded');
        resolve();
      };
      script.onerror = (error: any) => {
        console.error('Error loading Google Identity Services:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Loading Google API...');
      console.log('API Key:', process.env.REACT_APP_GOOGLE_API_KEY ? 'Present' : 'Missing');
      console.log('Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Present' : 'Missing');

      if (typeof window.gapi !== 'undefined') {
        console.log('GAPI already loaded, initializing client...');
        this.initializeGapiClient().then(resolve).catch(reject);
        return;
      }

      console.log('Loading GAPI script...');
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('GAPI script loaded');
        this.initializeGapiClient().then(resolve).catch(reject);
      };
      script.onerror = (error: any) => {
        console.error('Error loading GAPI script:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  private async initializeGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          // Initialize without API key - we'll use OAuth token instead
          await window.gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
          });
          console.log('GAPI client initialized');

          resolve();
        } catch (error: any) {
          console.error('Error initializing GAPI client:', error);
          reject(error);
        }
      });
    });
  }

  async signIn(): Promise<boolean> {
    try {
      console.log('Attempting to sign in with Google Identity Services...');
      console.log('Client ID from env:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

      if (!window.google || !window.google.accounts) {
        throw new Error('Google Identity Services no está cargada');
      }

      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'your_google_client_id_here') {
        throw new Error('Client ID no configurado. Por favor, actualiza el archivo .env con tu Client ID de Google.');
      }

      return new Promise((resolve, reject) => {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/calendar',
          callback: (response: any) => {
            if (response.error) {
              console.error('Error in token response:', response);
              reject(new Error(response.error_description || response.error));
              return;
            }

            console.log('Token received successfully');
            console.log('Token expires in:', response.expires_in, 'seconds');

            // Save token with expiry time
            const expiresIn = response.expires_in || 3600; // Default 1 hour if not provided
            this.saveToken(response.access_token, expiresIn);
            window.gapi.client.setToken({ access_token: response.access_token });
            resolve(true);
          },
        });

        console.log('Requesting access token...');
        // Usar prompt vacío para reutilizar consentimiento previo
        // Si el usuario ya autorizó previamente, no mostrará el diálogo de permisos
        this.tokenClient.requestAccessToken({ prompt: '' });
      });
    } catch (error: any) {
      console.error('Error signing in to Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Stop auto-refresh
      this.stopAutoRefresh();

      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token revoked');
        });
        this.clearToken();
        window.gapi.client.setToken(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  isSignedIn(): boolean {
    return this.accessToken !== null;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching events from', startDate.toISOString(), 'to', endDate.toISOString());

      if (!this.isSignedIn()) {
        console.error('User not signed in');
        throw new Error('User not signed in to Google Calendar');
      }

      // Check if calendar API is loaded
      console.log('Checking calendar API availability...');
      console.log('window.gapi:', typeof window.gapi);
      console.log('window.gapi.client:', typeof window.gapi?.client);
      console.log('window.gapi.client.calendar:', typeof window.gapi?.client?.calendar);

      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        console.error('Calendar API not loaded, attempting to load...');
        await window.gapi.client.load('calendar', 'v3');
        console.log('Calendar API loaded on demand');
      }

      // First, get the list of all calendars
      console.log('Fetching calendar list...');
      const calendarListResponse = await window.gapi.client.calendar.calendarList.list();
      const allCalendars = calendarListResponse.result.items || [];
      console.log('Found', allCalendars.length, 'calendars:', allCalendars.map((cal: any) => cal.summary));

      // Filter to only include specific calendars
      const allowedCalendarNames = ['j4alonso', 'sláinte', 'urteak'];
      const calendars = allCalendars.filter((cal: any) =>
        allowedCalendarNames.some(name => cal.summary.toLowerCase().includes(name))
      );
      console.log('Filtered to', calendars.length, 'calendars:', calendars.map((cal: any) => cal.summary));

      // Fetch events from filtered calendars in parallel
      const eventPromises = calendars.map(async (calendar: any) => {
        try {
          const response = await window.gapi.client.calendar.events.list({
            calendarId: calendar.id,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });
          console.log(`Events from calendar "${calendar.summary}":`, response.result.items?.length || 0);
          return response.result.items || [];
        } catch (error) {
          console.error(`Error fetching events from calendar "${calendar.summary}":`, error);
          return [];
        }
      });

      const eventsArrays = await Promise.all(eventPromises);
      const allEvents = eventsArrays.flat();

      // Sort all events by start time
      allEvents.sort((a: any, b: any) => {
        const aStart = a.start.dateTime || a.start.date;
        const bStart = b.start.dateTime || b.start.date;
        return new Date(aStart).getTime() - new Date(bStart).getTime();
      });

      console.log('Total events from all calendars:', allEvents.length);

      return allEvents;
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      console.error('Error details:', error.result || error.message);
      return [];
    }
  }

  async getEventsForMonth(year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    return this.getEvents(startDate, endDate);
  }

  async getEventsForToday(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return this.getEvents(startOfDay, endOfDay);
  }

  async getEventsForTomorrow(): Promise<CalendarEvent[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
    return this.getEvents(startOfDay, endOfDay);
  }

  formatEventTime(event: CalendarEvent): string {
    const start = event.start.dateTime || event.start.date;
    if (!start) return '';

    const date = new Date(start);
    if (event.start.date) {
      // All-day event
      return 'Todo el día';
    } else {
      // Timed event
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    calendarId?: string;
  }): Promise<CalendarEvent> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        await window.gapi.client.load('calendar', 'v3');
      }

      const calendarId = eventData.calendarId || 'primary';
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: {
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          start: eventData.start,
          end: eventData.end
        }
      });

      console.log('Event created:', response.result);
      return response.result;
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    calendarId?: string;
  }): Promise<CalendarEvent> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        await window.gapi.client.load('calendar', 'v3');
      }

      const calendarId = eventData.calendarId || 'primary';
      const response = await window.gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: {
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          start: eventData.start,
          end: eventData.end
        }
      });

      console.log('Event updated:', response.result);
      return response.result;
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
        await window.gapi.client.load('calendar', 'v3');
      }

      await window.gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      console.log('Event deleted:', eventId);
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();