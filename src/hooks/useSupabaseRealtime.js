import { useEffect, useRef } from "react";
import supabase from "../supabase";

/**
 * Hook personalizado para escuchar cambios en tiempo real en una tabla de Supabase.
 * Se suscribe a cambios de base de datos (INSERT, UPDATE, DELETE) en una tabla específica
 * y ejecuta un callback cuando se detectan cambios.
 *
 * @param {string} table - Nombre de la tabla a monitorear (ej: "usuarios", "proyectos")
 * @param {Function} callback - Función a ejecutar cuando se detecten cambios en la tabla
 * @returns {void}
 *
 * @example
 * // Monitorear cambios en tabla "usuarios"
 * useSupabaseRealtime("usuarios", () => {
 *   console.log("Usuarios actualizado!");
 *   fetchUsuarios(); // Recargar datos
 * });
 */
export default function useSupabaseRealtime(table, callback) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!table) return;

    // Use a unique channel name or listen per-table globally
    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: table },
        () => {
          if (savedCallback.current) {
            savedCallback.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}
