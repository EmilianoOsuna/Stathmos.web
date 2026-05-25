import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushPrompt({
  appName = "Stathmos",
  bgColor = "bg-[#1E1E1E]",
  textColor = "text-white",
  accentColor = "text-[#60aebb]",
  buttonBgColor = "bg-white text-black hover:bg-gray-100",
  positionClass = "fixed top-20 left-5 right-5 z-[90] md:max-w-md md:left-auto md:right-6 md:top-24"
}) {
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(true);
  const [loading, setLoading] = useState(false);

  // No mostrar si no está soportado, ya está suscrito, denegado, o si el usuario lo cerró
  if (!isSupported || isSubscribed || permission === 'denied' || !showPrompt) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe();
      setShowPrompt(false);
    } catch (error) {
      console.error("Error subscribing to push notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pushPromptDismissed', 'true');
  };

  const hasPromptBeenDismissed = localStorage.getItem('pushPromptDismissed');
  if (hasPromptBeenDismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className={`${positionClass} ${bgColor} ${textColor} rounded-[2rem] shadow-2xl border border-white/10 p-5 overflow-hidden`}
        >
          {/* Brillo de fondo */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-white/10 ${accentColor} shrink-0`}>
              <Bell size={24} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="font-bold text-lg mb-1 leading-tight">Notificaciones Push</h3>
              <p className="text-sm opacity-80 leading-relaxed mb-4">
                Activa las notificaciones para enterarte al instante de actualizaciones de tus proyectos.
              </p>
              
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className={`w-full font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 ${buttonBgColor} disabled:opacity-50`}
              >
                {loading ? 'Activando...' : 'Activar notificaciones'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
