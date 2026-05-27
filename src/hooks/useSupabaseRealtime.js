import { useEffect, useRef, useState } from "react";
import supabase from "../supabase";

// Global registry in memory mapping table names to their channel details:
// {
//   [table]: {
//     channel: SupabaseChannel,
//     callbacks: Set<Function>,
//     refCount: number
//   }
// }
const channelRegistry = {};

// Debounce timer registry to group high-frequency write events per table
const debouncedDispatch = {};

const triggerTableCallbacks = (table, payload) => {
  if (debouncedDispatch[table]) {
    clearTimeout(debouncedDispatch[table]);
  }
  debouncedDispatch[table] = setTimeout(() => {
    const entry = channelRegistry[table];
    if (entry) {
      entry.callbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error("Error executing realtime callback for table:", table, e);
        }
      });
    }
  }, 150); // 150ms debounce time window
};

/**
 * Hook personalizado para escuchar cambios en tiempo real en una tabla de Supabase.
 * Multiplexa suscripciones para compartir un único canal WebSocket por tabla activa.
 *
 * @param {string} table - Nombre de la tabla a monitorear (ej: "refacciones", "citas")
 * @param {Function} callback - Función a ejecutar cuando se detecten cambios en la tabla
 */
export default function useSupabaseRealtime(table, callback) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!table) return;

    // Initialize shared subscription registry if this is the first hook listening to the table
    if (!channelRegistry[table]) {
      const channelName = `realtime-${table}-shared`;
      const callbacks = new Set();

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: table },
          (payload) => {
            triggerTableCallbacks(table, payload);
          }
        );

      channelRegistry[table] = {
        channel,
        callbacks,
        refCount: 0,
      };
    }

    const entry = channelRegistry[table];

    // Callback proxy to invoke the latest callback version registered by the calling component
    const callbackRunner = (payload) => {
      if (savedCallback.current) {
        savedCallback.current(payload);
      }
    };

    entry.callbacks.add(callbackRunner);
    entry.refCount++;

    // Subscribe on the first reference
    if (entry.refCount === 1) {
      entry.channel.subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`Realtime channel connection warning for table: ${table} (Status: ${status})`);
        }
      });
    }

    // Cleanup and release channel when no component is listening anymore
    return () => {
      if (!channelRegistry[table]) {
        // Already cleaned up globally
        return;
      }
      entry.callbacks.delete(callbackRunner);
      entry.refCount--;

      if (entry.refCount <= 0) {
        try {
          supabase.removeChannel(entry.channel);
        } catch (e) {
          console.warn(`Error removing channel for table ${table}:`, e);
        }
        delete channelRegistry[table];
        if (debouncedDispatch[table]) {
          clearTimeout(debouncedDispatch[table]);
          delete debouncedDispatch[table];
        }
      }
    };
  }, [table]);
}

/**
 * Elimina y cancela todas las suscripciones a canales realtime activos.
 * Debe ser invocado antes de cerrar sesión para evitar advertencias de conexión.
 */
export function cleanAllRealtimeChannels() {
  Object.keys(channelRegistry).forEach((table) => {
    const entry = channelRegistry[table];
    if (entry) {
      if (entry.channel) {
        try {
          supabase.removeChannel(entry.channel);
        } catch (e) {
          console.warn(`Error removing channel for table ${table} during global cleanup:`, e);
        }
      }
      delete channelRegistry[table];
    }
  });
}

/**
 * Hook para monitorear el estado unificado de la conexión WebSocket de Supabase.
 * 
 * @returns {"connected" | "connecting" | "disconnected"}
 */
export function useSupabaseConnectionState() {
  const [state, setState] = useState(() => {
    const rt = supabase.realtime;
    if (!rt) return "disconnected";
    const s = rt.connectionState();
    return s === "open" ? "connected" : s === "connecting" ? "connecting" : "disconnected";
  });

  useEffect(() => {
    const rt = supabase.realtime;
    if (!rt || !rt.stateChangeCallbacks) return;

    const handleOpen = () => setState("connected");
    const handleClose = () => setState("disconnected");
    const handleError = () => setState("disconnected");

    rt.stateChangeCallbacks.open.push(handleOpen);
    rt.stateChangeCallbacks.close.push(handleClose);
    rt.stateChangeCallbacks.error.push(handleError);

    // Initial check to prevent sync issues
    queueMicrotask(() => {
      const s = rt.connectionState();
      setState(s === "open" ? "connected" : s === "connecting" ? "connecting" : "disconnected");
    });

    return () => {
      rt.stateChangeCallbacks.open = rt.stateChangeCallbacks.open.filter((cb) => cb !== handleOpen);
      rt.stateChangeCallbacks.close = rt.stateChangeCallbacks.close.filter((cb) => cb !== handleClose);
      rt.stateChangeCallbacks.error = rt.stateChangeCallbacks.error.filter((cb) => cb !== handleError);
    };
  }, []);

  return state;
}
