// Tipos de usuario y autenticación
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

// Tipos de notas
export interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  etiquetas: string[];
  archivos_adjuntos: string[];
  parent_id: string;
  parent_type: 'caja' | 'cajita';
  created_at: string;
  updated_at: string;
}

export interface NotaCreate {
  titulo: string;
  contenido: string;
  etiquetas?: string[];
  parent_id: string;
  parent_type: 'caja' | 'cajita';
}

export interface NotaUpdate {
  titulo?: string;
  contenido?: string;
  etiquetas?: string[];
}

// Tipos de cajitas
export interface Cajita {
  id: string;
  nombre: string;
  descripcion?: string;
  caja_id: string;
  notas: Nota[];
  created_at: string;
  updated_at: string;
}

export interface CajitaCreate {
  nombre: string;
  descripcion?: string;
  caja_id: string;
}

export interface CajitaUpdate {
  nombre?: string;
  descripcion?: string;
}

// Tipos de cajas
export interface Caja {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  armario_id: string;
  cajitas: Cajita[];
  notas: Nota[];
  created_at: string;
  updated_at: string;
}

export interface CajaCreate {
  nombre: string;
  descripcion?: string;
  color?: string;
  armario_id: string;
}

export interface CajaUpdate {
  nombre?: string;
  descripcion?: string;
  color?: string;
}

// Tipos de armarios
export interface Armario {
  id: string;
  nombre: string;
  descripcion?: string;
  is_default: boolean;
  cajas: Caja[];
  created_at: string;
  updated_at: string;
}

export interface ArmarioCreate {
  nombre: string;
  descripcion?: string;
  is_default?: boolean;
}

export interface ArmarioUpdate {
  nombre?: string;
  descripcion?: string;
}

// Tipos para la UI
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  path?: string;
}

// Estados de la aplicación
export interface AppState {
  user: User | null;
  currentArmario: Armario | null;
  currentCaja: Caja | null;
  currentCajita: Cajita | null;
  currentNota: Nota | null;
  isLoading: boolean;
  error: string | null;
}

// Tipos de respuesta API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// Tipos para formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}