importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (typeof workbox !== 'undefined') {
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
} else {
    console.log('Workbox falló en cargar');
}

self.addEventListener('push', (event) => {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.cuerpo || 'Tienes una nueva notificación',
                icon: data.icono || '/pwa-192x192.png',
                data: {
                    url: data.url || '/'
                }
            };

            event.waitUntil(
                self.registration.showNotification(data.titulo || 'Stathmos', options)
            );
        } catch (e) {
            console.error('Error al parsear el payload de la notificación push:', e);
        }
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si ya hay una pestaña abierta con esa URL, enfócala
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abre una nueva ventana
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Aquí agregaremos los event listeners para las notificaciones (Fase 4)
