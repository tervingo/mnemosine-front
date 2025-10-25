import { GoogleAuth } from 'google-auth-library';

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

export class GoogleCalendarService {
  private auth: GoogleAuth | null = null;
  private accessToken: string | null = null;

  // For web applications, we'll use OAuth 2.0 flow
  async initializeAuth(): Promise<void> {
    // This will be implemented using Google's JavaScript API
    // For now, we'll create a placeholder that can be extended
    await this.loadGoogleAPI();
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google API script if not already loaded
      if (typeof (window as any).gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client:auth2', () => {
          (window as any).gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.readonly'
          }).then(() => {
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        return true;
      }

      const user = await authInstance.signIn();
      this.accessToken = user.getAuthResponse().access_token;
      return true;
    } catch (error) {
      console.error('Error signing in to Google:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.accessToken = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  isSignedIn(): boolean {
    if (typeof (window as any).gapi === 'undefined') return false;
    const authInstance = (window as any).gapi.auth2.getAuthInstance();
    return authInstance && authInstance.isSignedIn.get();
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
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