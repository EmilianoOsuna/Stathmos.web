import { useState, useEffect } from 'react';
import supabase from '../supabase';
import { urlBase64ToUint8Array } from '../lib/pushUtils';

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      // Checar si ya existe la suscripción en el navegador
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
        }
      });
    }
  }, []);

  const subscribe = async () => {
    try {
      console.log('1. Solicitando permisos de notificación...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Permiso de notificaciones denegado.');
      }

      console.log('2. Esperando a que el Service Worker esté listo...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker listo:', registration);
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VITE_VAPID_PUBLIC_KEY no está definida en .env');
      }
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      console.log('3. Suscribiendo en el navegador...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('Suscripción generada:', subscription);

      console.log('4. Obteniendo sesión de Supabase...');
      // Insertar en Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado.');
      }

      console.log('5. Limpiando suscripciones previas con el mismo endpoint...');
      const subJson = subscription.toJSON();
      if (subJson.endpoint) {
        const { error: deleteError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('subscription->>endpoint', subJson.endpoint);
        if (deleteError) {
          console.warn('Advertencia al limpiar suscripciones previas:', deleteError.message || deleteError);
        } else {
          console.log('Limpieza de suscripciones duplicadas completada.');
        }
      }

      console.log('6. Guardando suscripción en Supabase...');
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription: subJson
        });

      if (error) {
        throw error;
      }

      console.log('¡Suscripción exitosa!');
      setIsSubscribed(true);
      return subscription;
    } catch (error) {
      console.error('Error al suscribirse a Push:', error);
      throw error;
    }
  };

  return { isSupported, permission, isSubscribed, subscribe };
}

export async function deletePushSubscription() {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const subJson = subscription.toJSON();
        if (subJson.endpoint) {
          console.log('Eliminando suscripción push de la base de datos...');
          const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription->>endpoint', subJson.endpoint);
          if (error) {
            console.warn('Error al borrar la suscripción de la base de datos:', error.message || error);
          } else {
            console.log('Suscripción push eliminada con éxito de la base de datos.');
          }
        }
        // Desuscribir en el navegador también para estar limpios
        await subscription.unsubscribe();
        console.log('Suscripción push desactivada en el navegador.');
      }
    }
  } catch (error) {
    console.error('Error al eliminar la suscripción push:', error);
  }
}
