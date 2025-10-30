import axios, { AxiosInstance } from 'axios';
import {
  User,
  UserCreate,
  LoginCredentials,
  AuthResponse,
  Armario,
  ArmarioCreate,
  ArmarioUpdate,
  Caja,
  CajaCreate,
  CajaUpdate,
  Cajita,
  CajitaCreate,
  CajitaUpdate,
  Nota,
  NotaCreate,
  NotaUpdate,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para añadir token de autenticación
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async register(userData: UserCreate): Promise<User> {
    const response = await this.api.post<User>('/auth/register', userData);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await this.api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Guardar token y usuario en localStorage
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Métodos de armarios
  async getArmarios(): Promise<Armario[]> {
    const response = await this.api.get<Armario[]>('/armarios/');
    return response.data;
  }

  async getArmario(id: string): Promise<Armario> {
    const response = await this.api.get<Armario>(`/armarios/${id}`);
    return response.data;
  }

  async createArmario(armarioData: ArmarioCreate): Promise<Armario> {
    const response = await this.api.post<Armario>('/armarios/', armarioData);
    return response.data;
  }

  async updateArmario(id: string, armarioData: ArmarioUpdate): Promise<Armario> {
    const response = await this.api.put<Armario>(`/armarios/${id}`, armarioData);
    return response.data;
  }

  async deleteArmario(id: string): Promise<void> {
    await this.api.delete(`/armarios/${id}`);
  }

  async setDefaultArmario(id: string): Promise<void> {
    await this.api.put(`/armarios/${id}/set-default`);
  }

  // Métodos de cajas
  async getCajasByArmario(armarioId: string): Promise<Caja[]> {
    const response = await this.api.get<Caja[]>(`/cajas/armario/${armarioId}`);
    return response.data;
  }

  async getCaja(id: string): Promise<Caja> {
    const response = await this.api.get<Caja>(`/cajas/${id}`);
    return response.data;
  }

  async createCaja(cajaData: CajaCreate): Promise<Caja> {
    const response = await this.api.post<Caja>('/cajas/', cajaData);
    return response.data;
  }

  async updateCaja(id: string, cajaData: CajaUpdate): Promise<Caja> {
    const response = await this.api.put<Caja>(`/cajas/${id}`, cajaData);
    return response.data;
  }

  async deleteCaja(id: string): Promise<void> {
    await this.api.delete(`/cajas/${id}`);
  }

  // Métodos de cajitas
  async getCajitasByCaja(cajaId: string): Promise<Cajita[]> {
    const response = await this.api.get<Cajita[]>(`/cajitas/caja/${cajaId}`);
    return response.data;
  }

  async getCajita(id: string): Promise<Cajita> {
    const response = await this.api.get<Cajita>(`/cajitas/${id}`);
    return response.data;
  }

  async createCajita(cajitaData: CajitaCreate): Promise<Cajita> {
    const response = await this.api.post<Cajita>('/cajitas/', cajitaData);
    return response.data;
  }

  async updateCajita(id: string, cajitaData: CajitaUpdate): Promise<Cajita> {
    const response = await this.api.put<Cajita>(`/cajitas/${id}`, cajitaData);
    return response.data;
  }

  async deleteCajita(id: string): Promise<void> {
    await this.api.delete(`/cajitas/${id}`);
  }

  // Métodos de notas
  async getNotasByContainer(containerId: string, containerType: 'caja' | 'cajita'): Promise<Nota[]> {
    const response = await this.api.get<Nota[]>(`/notas/container/${containerId}/${containerType}`);
    return response.data;
  }

  async getNota(id: string): Promise<Nota> {
    const response = await this.api.get<Nota>(`/notas/${id}`);
    return response.data;
  }

  async createNota(notaData: NotaCreate): Promise<Nota> {
    const response = await this.api.post<Nota>('/notas/', notaData);
    return response.data;
  }

  async updateNota(id: string, notaData: NotaUpdate): Promise<Nota> {
    const response = await this.api.put<Nota>(`/notas/${id}`, notaData);
    return response.data;
  }

  async deleteNota(id: string): Promise<void> {
    await this.api.delete(`/notas/${id}`);
  }

  async moveNota(id: string, newParentId: string, newParentType: 'caja' | 'cajita'): Promise<void> {
    await this.api.put(`/notas/${id}/move`, {
      new_parent_id: newParentId,
      new_parent_type: newParentType
    });
  }

  async searchNotas(query: string): Promise<Nota[]> {
    const response = await this.api.get<Nota[]>(`/notas/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getAllEtiquetas(): Promise<string[]> {
    const response = await this.api.get<string[]>('/notas/etiquetas');
    return response.data;
  }

  // Métodos de recordatorios
  async createReminder(reminderData: {
    event_id: string;
    event_title: string;
    event_start: string;
    minutes_before: number;
  }): Promise<any> {
    const response = await this.api.post('/reminders/', reminderData);
    return response.data;
  }

  async getReminderByEventId(eventId: string): Promise<any> {
    try {
      const response = await this.api.get(`/reminders/event/${eventId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateReminder(eventId: string, reminderData: {
    event_title: string;
    event_start: string;
    minutes_before: number;
  }): Promise<any> {
    const response = await this.api.put(`/reminders/event/${eventId}`, reminderData);
    return response.data;
  }

  async deleteReminder(reminderId: string): Promise<void> {
    await this.api.delete(`/reminders/${reminderId}`);
  }

  // Métodos de recordatorios internos
  async createInternalReminder(reminderData: {
    title: string;
    reminder_datetime: string;
    minutes_before: number;
    description?: string;
  }): Promise<any> {
    const response = await this.api.post('/internal-reminders/', reminderData);
    return response.data;
  }

  async getInternalReminders(): Promise<any[]> {
    const response = await this.api.get('/internal-reminders/');
    return response.data;
  }

  async getInternalReminder(reminderId: string): Promise<any> {
    const response = await this.api.get(`/internal-reminders/${reminderId}`);
    return response.data;
  }

  async updateInternalReminder(reminderId: string, reminderData: {
    title: string;
    reminder_datetime: string;
    minutes_before: number;
    description?: string;
  }): Promise<any> {
    const response = await this.api.put(`/internal-reminders/${reminderId}`, reminderData);
    return response.data;
  }

  async deleteInternalReminder(reminderId: string): Promise<void> {
    await this.api.delete(`/internal-reminders/${reminderId}`);
  }
}

// Crear instancia singleton del servicio API
export const apiService = new ApiService();

// Función helper para manejar errores de API
export const handleApiError = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'Ha ocurrido un error inesperado';
};