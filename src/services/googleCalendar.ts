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

  async initializeAuth(): Promise<void> {
    await Promise.all([
      this.loadGoogleIdentityServices(),
      this.loadGoogleAPI()
    ]);
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
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          callback: (response: any) => {
            if (response.error) {
              console.error('Error in token response:', response);
              reject(new Error(response.error_description || response.error));
              return;
            }

            console.log('Token received successfully');
            this.accessToken = response.access_token;
            window.gapi.client.setToken({ access_token: response.access_token });
            resolve(true);
          },
        });

        console.log('Requesting access token...');
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error: any) {
      console.error('Error signing in to Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token revoked');
        });
        this.accessToken = null;
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

      console.log('Making API call to Google Calendar...');
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      console.log('Calendar API response:', response);
      console.log('Number of events found:', response.result.items?.length || 0);

      if (response.result.items && response.result.items.length > 0) {
        console.log('Sample event:', response.result.items[0]);
      }

      return response.result.items || [];
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
}

export const googleCalendarService = new GoogleCalendarService();