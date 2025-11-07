import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, LoginCredentials, UserCreate, AuthResponse } from '../types';
import { apiService, handleApiError } from '../services/api';
import { useActivityDetector } from './useActivityDetector';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
  sessionExpiringWarning: boolean;
  extendSession: () => void;
  minutesUntilExpiry: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_EXPIRE_TIME = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // Mostrar advertencia 5 minutos antes
const INACTIVITY_TIMEOUT = 25 * 60 * 1000; // 25 minutos de inactividad

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiringWarning, setSessionExpiringWarning] = useState(false);
  const [minutesUntilExpiry, setMinutesUntilExpiry] = useState<number>(30);
  const tokenExpireTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expiryTimeRef = useRef<number | null>(null);
  const updateTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTokenRefreshRef = useRef<number>(0);

  const isAuthenticated = !!user;

  // Función para actualizar minutos restantes
  const updateMinutesRemaining = useCallback(() => {
    if (expiryTimeRef.current) {
      const now = Date.now();
      const timeLeft = expiryTimeRef.current - now;
      const minutes = Math.max(0, Math.ceil(timeLeft / (60 * 1000)));
      setMinutesUntilExpiry(minutes);

      // Si llegamos a 0, limpiar el intervalo
      if (minutes <= 0 && updateTimerIntervalRef.current) {
        clearInterval(updateTimerIntervalRef.current);
        updateTimerIntervalRef.current = null;
      }
    }
  }, []);

  // Función para iniciar los timers de expiración
  const startExpirationTimers = useCallback(() => {
    // Limpiar timers anteriores
    if (tokenExpireTimeoutRef.current) {
      clearTimeout(tokenExpireTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (updateTimerIntervalRef.current) {
      clearInterval(updateTimerIntervalRef.current);
    }

    // Establecer tiempo de expiración
    expiryTimeRef.current = Date.now() + TOKEN_EXPIRE_TIME;
    setMinutesUntilExpiry(30); // Resetear a 30 minutos

    // Actualizar contador cada minuto
    updateTimerIntervalRef.current = setInterval(updateMinutesRemaining, 60 * 1000);

    // Actualizar inmediatamente
    updateMinutesRemaining();

    // Timer para mostrar advertencia
    warningTimeoutRef.current = setTimeout(() => {
      setSessionExpiringWarning(true);
      console.log('⚠️ Sesión expirará pronto');
    }, TOKEN_EXPIRE_TIME - WARNING_TIME);

    // Timer para logout automático
    tokenExpireTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Sesión expirada por tiempo (30 minutos sin actividad)');
      logout();
    }, TOKEN_EXPIRE_TIME);
  }, [updateMinutesRemaining]);

  // Función para renovar el token automáticamente
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.log('❌ No hay refresh token en localStorage, cerrando sesión');
        logout();
        return;
      }

      console.log('🔄 Renovando token en servidor...');
      const response = await apiService.refreshToken(refreshToken);

      localStorage.setItem('access_token', response.access_token);
      console.log('✅ Token renovado exitosamente en servidor');

      // Reiniciar timers
      lastTokenRefreshRef.current = Date.now();
      startExpirationTimers();
      setSessionExpiringWarning(false);
    } catch (error) {
      console.error('❌ Error renovando token en servidor:', error);
      logout();
    }
  }, [startExpirationTimers]);

  // Función para extender la sesión manualmente
  const extendSession = useCallback(() => {
    refreshAccessToken();
  }, [refreshAccessToken]);

  // Función memoizada para manejar actividad del usuario
  const handleUserActivity = useCallback(() => {
    if (isAuthenticated && !sessionExpiringWarning) {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastTokenRefreshRef.current;
      const REFRESH_THROTTLE = 2 * 60 * 1000; // 2 minutos

      // Siempre resetear timers localmente (contador visual)
      startExpirationTimers();

      // Solo renovar token en servidor si han pasado más de 2 minutos
      if (timeSinceLastRefresh > REFRESH_THROTTLE) {
        console.log('🔄 Renovando token en servidor (actividad detectada)...');
        lastTokenRefreshRef.current = now;
        refreshAccessToken();
      }
    } else if (!isAuthenticated) {
      console.warn('⚠️ Actividad detectada pero usuario NO autenticado');
    }
  }, [isAuthenticated, sessionExpiringWarning, startExpirationTimers, refreshAccessToken]);

  // Detector de actividad - resetear timers localmente en cada actividad
  useActivityDetector({
    onActivity: handleUserActivity,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    throttle: 5000 // Detectar actividad cada 5 segundos máximo
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Mostrar razón del último logout si existe
        const lastLogoutReason = sessionStorage.getItem('last_logout_reason');
        const lastLogoutTime = sessionStorage.getItem('last_logout_time');
        if (lastLogoutReason && lastLogoutTime) {
          console.log('📋 Último logout ocurrió en:', lastLogoutTime);
          console.log('📋 Razón del último logout:');
          console.log(lastLogoutReason);
          // Limpiar después de mostrar
          sessionStorage.removeItem('last_logout_reason');
          sessionStorage.removeItem('last_logout_time');
        }

        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verificar que el token sigue siendo válido
          try {
            const currentUser = await apiService.getCurrentUser();
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));

            // Iniciar timers de expiración al restaurar sesión
            lastTokenRefreshRef.current = Date.now();
            startExpirationTimers();
            console.log('🔄 Sesión restaurada - timers activados');
          } catch (error) {
            // Token inválido, limpiar localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [startExpirationTimers]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response: AuthResponse = await apiService.login(credentials);
      setUser(response.user);

      // Verificar que tenemos refresh token
      const storedRefreshToken = localStorage.getItem('refresh_token');
      console.log('🔐 Sesión iniciada');
      console.log('   - Access token guardado:', !!localStorage.getItem('access_token'));
      console.log('   - Refresh token guardado:', !!storedRefreshToken);
      console.log('   - Refresh token:', storedRefreshToken ? storedRefreshToken.substring(0, 20) + '...' : 'NINGUNO');

      // Iniciar timers de expiración después del login
      lastTokenRefreshRef.current = Date.now();
      startExpirationTimers();
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await apiService.register(userData);

      // Después del registro, hacer login automáticamente
      await login({
        username: userData.email,
        password: userData.password,
      });
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    // Capturar stack trace para saber quién llamó logout
    console.log('🚪 LOGOUT LLAMADO. Stack trace:');
    console.trace();

    // Guardar razón del logout en sessionStorage para debugging
    const logoutReason = new Error().stack || 'Unknown';
    sessionStorage.setItem('last_logout_reason', logoutReason);
    sessionStorage.setItem('last_logout_time', new Date().toISOString());

    // Limpiar todos los timers
    if (tokenExpireTimeoutRef.current) {
      clearTimeout(tokenExpireTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (updateTimerIntervalRef.current) {
      clearInterval(updateTimerIntervalRef.current);
    }

    apiService.logout();
    setUser(null);
    setError(null);
    setMinutesUntilExpiry(0);

    // Esperar un poco antes de redirigir para que los logs se vean
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
    clearError,
    sessionExpiringWarning,
    extendSession,
    minutesUntilExpiry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Hook para rutas protegidas
export const useRequireAuth = (): AuthContextType => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
};