import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // Intervalo en milisegundos (default: 30000 = 30 segundos)
  enabled?: boolean; // Si el autosave está activado
}

/**
 * Hook para autoguardar datos en base de datos cada X segundos
 * Solo guarda si hay cambios desde el último guardado
 */
export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000, // 30 segundos por defecto
  enabled = true
}: UseAutoSaveOptions<T>) {
  const lastSavedData = useRef<T>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSaving = useRef(false);

  // Función para verificar si los datos han cambiado
  const hasChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(lastSavedData.current);
  }, [data]);

  // Función para guardar
  const save = useCallback(async () => {
    // Verificar cambios en el momento de guardar, no cuando se creó la función
    const currentHasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedData.current);

    if (isSaving.current || !currentHasChanges) {
      console.log('⏭️ Autoguardado omitido (sin cambios o guardando)');
      return;
    }

    try {
      isSaving.current = true;
      await onSave(data);
      lastSavedData.current = data;
      console.log('✅ Autoguardado exitoso');
    } catch (error) {
      console.error('❌ Error en autoguardado:', error);
    } finally {
      isSaving.current = false;
    }
  }, [data, onSave]);

  // Efecto para configurar el autoguardado
  useEffect(() => {
    if (!enabled) {
      // Si no está habilitado, sincronizar lastSavedData con data actual
      // Esto previene falsos positivos cuando se carga la nota por primera vez
      lastSavedData.current = data;
      return;
    }

    // Limpiar timeout anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Solo configurar nuevo timeout si hay cambios
    const currentHasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedData.current);
    if (currentHasChanges) {
      console.log('⏰ Programando autoguardado en', interval / 1000, 'segundos');
      saveTimeoutRef.current = setTimeout(() => {
        save();
      }, interval);
    }

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, interval, save]);

  // Guardar inmediatamente al desmontar el componente
  useEffect(() => {
    const dataSnapshot = data;
    const onSaveSnapshot = onSave;

    return () => {
      // Verificar cambios en el momento del desmontaje
      const finalHasChanges = JSON.stringify(dataSnapshot) !== JSON.stringify(lastSavedData.current);
      if (finalHasChanges && !isSaving.current) {
        // Guardar de forma síncrona al desmontar
        onSaveSnapshot(dataSnapshot).catch(error => {
          console.error('❌ Error en guardado final:', error);
        });
      }
    };
  }, [data, onSave]);

  // Retornar función para forzar guardado manual
  return {
    saveNow: save,
    hasUnsavedChanges: hasChanges()
  };
}
