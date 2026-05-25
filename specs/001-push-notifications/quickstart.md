# Quickstart: Push Notifications

Esta guía resume cómo los desarrolladores interactuarán con el sistema de notificaciones push en el código una vez implementado.

## Frontend (React)

Para suscribir a un usuario, utilizarás el nuevo hook que crearemos `usePushNotifications`:

```javascript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MiComponente() {
  const { subscribe, isSubscribed, permission } = usePushNotifications();

  const handleSubscribe = async () => {
    if (permission !== 'granted') {
      const success = await subscribe();
      if (success) {
        console.log("¡Suscrito con éxito!");
      }
    }
  };

  return (
    <button onClick={handleSubscribe} disabled={isSubscribed}>
      {isSubscribed ? 'Notificaciones Activadas' : 'Activar Notificaciones'}
    </button>
  );
}
```

## Backend (Edge Functions)

Las notificaciones se disparan automáticamente (probablemente actualizando la función actual `enviar-notificacion`). 
Si se necesita enviar una manualmente o probarla, se usará la misma tabla de siempre, y la Edge Function leerá las suscripciones (en la nueva tabla `push_subscriptions`) y enviará el push internamente.

No se requerirá llamar a web-push directamente desde el cliente React.
