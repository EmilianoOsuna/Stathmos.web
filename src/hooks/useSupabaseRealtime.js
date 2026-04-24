import { useEffect, useRef } from "react";
import supabase from "../supabase";

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
