import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

export default function InstallPrompt({
  appName = "Stathmos",
  descriptionAndroid = "Añade la app a tu pantalla de inicio para acceder rápido y recibir notificaciones.",
  descriptionIOS = "Toca el botón 'Compartir' y luego 'Agregar a inicio' para una experiencia inmaculada.",
  bgColor = "bg-[#1E1E1E]",
  textColor = "text-white",
  accentColor = "text-[#D4AF37]",
  buttonBgColor = "bg-white text-black hover:bg-gray-100",
  positionClass = "fixed bottom-6 left-5 right-5 z-[100] md:max-w-md md:left-auto md:right-6 md:bottom-6"
}) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detectar si está en modo standalone (PWA ya instalada)
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
    
    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Para iOS, mostrar después de 5 segundos
      const timer = setTimeout(() => {
        const hasPromptBeenDismissed = localStorage.getItem('installPromptDismissed');
        if (!hasPromptBeenDismissed) {
          setShowPrompt(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Para Android / Chrome Desktop
      const handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        
        // Retrasar 3 segundos
        setTimeout(() => {
          const hasPromptBeenDismissed = localStorage.getItem('installPromptDismissed');
          if (!hasPromptBeenDismissed) {
            setShowPrompt(true);
          }
        }, 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt nativo
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('El usuario aceptó la instalación');
    } else {
      console.log('El usuario rechazó la instalación');
    }
    
    // Limpiar estado
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

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
              <Download size={24} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 pr-6">
              <h3 className="font-bold text-lg mb-1 leading-tight">Instalar {appName}</h3>
              <p className="text-sm opacity-80 leading-relaxed mb-4">
                {isIOS ? descriptionIOS : descriptionAndroid}
              </p>
              
              {!isIOS ? (
                <button
                  onClick={handleInstallClick}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all active:scale-95 ${buttonBgColor}`}
                >
                  Instalar ahora
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs opacity-75 bg-white/5 p-3 rounded-xl">
                  <Share size={14} className={accentColor} />
                  <span>Toca compartir y luego "Agregar a inicio"</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
