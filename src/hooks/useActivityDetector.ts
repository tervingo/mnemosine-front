import { useEffect, useRef, useCallback } from 'react';

interface UseActivityDetectorOptions {
  onActivity?: () => void;
  onInactivity?: () => void;
  inactivityTimeout?: number; // Tiempo en ms de inactividad antes de llamar onInactivity
  throttle?: number; // Tiempo mínimo entre llamadas a onActivity (ms)
}

/**
 * Hook para detectar actividad del usuario (clicks, teclas, movimiento del mouse, scroll)
 * Útil para renovar tokens automáticamente mientras el usuario está activo
 */
export function useActivityDetector({
  onActivity,
  onInactivity,
  inactivityTimeout = 5 * 60 * 1000, // 5 minutos por defecto
  throttle = 1000 // 1 segundo por defecto
}: UseActivityDetectorOptions = {}) {
  const lastActivityRef = useRef<number>(Date.now());
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(true);

  // Usar refs para las callbacks para evitar recrear handleActivity
  const onActivityRef = useRef(onActivity);
  const onInactivityRef = useRef(onInactivity);

  // Actualizar refs cuando cambien las funciones
  useEffect(() => {
    onActivityRef.current = onActivity;
    onInactivityRef.current = onInactivity;
  }, [onActivity, onInactivity]);

  // Función para manejar actividad
  const handleActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Cambiar a activo si estaba inactivo
    if (!isActiveRef.current && onActivityRef.current) {
      isActiveRef.current = true;
      console.log('👤 Usuario volvió a estar activo');
    }

    // Throttle: solo llamar onActivity si han pasado X ms desde la última llamada
    if (!throttleTimeoutRef.current) {
      if (onActivityRef.current) {
        onActivityRef.current();
      }

      throttleTimeoutRef.current = setTimeout(() => {
        throttleTimeoutRef.current = null;
      }, throttle);
    }

    // Reiniciar timeout de inactividad
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current && onInactivityRef.current) {
        isActiveRef.current = false;
        console.log('😴 Usuario inactivo');
        onInactivityRef.current();
      }
    }, inactivityTimeout);
  }, [inactivityTimeout, throttle]);

  // Configurar listeners de eventos
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timeout de inactividad
    handleActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      // NO limpiar throttleTimeoutRef aquí porque queremos que se complete
      // Solo limpiar el timeout de inactividad
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [handleActivity]);

  return {
    lastActivity: lastActivityRef.current,
    isActive: isActiveRef.current
  };
}
