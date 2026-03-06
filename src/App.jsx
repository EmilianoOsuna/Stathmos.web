import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Users, Wrench, LogOut, Plus, X } from 'lucide-react';

// --- COMPONENTE LOGIN ---
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenciales inválidas');
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      onLoginSuccess();
    }, 800);
  };

  const blockVariants = {
    initial: { height: "10vh", y: 0 },
    animate: { height: "100vh", y: 0, transition: { duration: 0.6, ease: "easeInOut" } }
  };

  return (
    <div className="relative h-screen w-full bg-[#2A2A2A] flex flex-col items-center justify-center overflow-hidden">
      <div className="z-10 w-full max-w-sm px-6 flex flex-col items-center">
        <img src="/stathmos.png" alt="Stathmos Logo" className="w-64 mb-12 invert" />
        
        <form onSubmit={handleLogin} className="w-full space-y-8">
          <div className="relative">
            <input
              type="email"
              placeholder="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-gray-400 py-2 text-white focus:outline-none focus:border-[#7DBEBA] transition-colors placeholder-gray-500"
              required
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-gray-400 py-2 text-white focus:outline-none focus:border-[#7DBEBA] transition-colors placeholder-gray-500"
              required
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-[#D85A3A] hover:bg-[#c24f32] text-white py-3 transition-colors font-medium tracking-wide">
            Ingresar
          </button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 w-full flex items-end">
        <motion.div variants={blockVariants} initial="initial" animate={isAnimating ? "animate" : "initial"} className="w-1/5 bg-[#66B2B2]" style={{ height: '15vh' }} />
        <motion.div variants={blockVariants} initial="initial" animate={isAnimating ? "animate" : "initial"} transition={{ delay: 0.1 }} className="w-1/5 bg-[#4F9A9A]" style={{ height: '8vh' }} />
        <motion.div variants={blockVariants} initial="initial" animate={isAnimating ? "animate" : "initial"} transition={{ delay: 0.2 }} className="w-1/5 bg-[#9DE0D8]" style={{ height: '20vh' }} />
        <motion.div variants={blockVariants} initial="initial" animate={isAnimating ? "animate" : "initial"} transition={{ delay: 0.15 }} className="w-1/5 bg-[#3B7A7A]" style={{ height: '12vh' }} />
        <motion.div variants={blockVariants} initial="initial" animate={isAnimating ? "animate" : "initial"} transition={{ delay: 0.05 }} className="w-1/5 bg-[#80CBC4]" style={{ height: '18vh' }} />
      </div>
    </div>
  );
};

// --- COMPONENTE DASHBOARD (Administrador) ---
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('clientes');
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  // Estados para los modales
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Estados para los formularios
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', correo: '', direccion: '' });
  const [formProyecto, setFormProyecto] = useState({ cliente_id: '', vehiculo_id: '', titulo: '', descripcion: '' });
  
  // Estado para cargar dinámicamente los vehículos de un cliente
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Efecto para buscar los vehículos cuando se selecciona un cliente en el modal de proyecto
  useEffect(() => {
    const fetchVehiculos = async () => {
      if (formProyecto.cliente_id) {
        const { data } = await supabase.from('vehiculos').select('*').eq('cliente_id', formProyecto.cliente_id);
        setVehiculosDisponibles(data || []);
      } else {
        setVehiculosDisponibles([]);
      }
    };
    fetchVehiculos();
  }, [formProyecto.cliente_id]);

  const fetchData = async () => {
    if (activeTab === 'clientes') {
      const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (data) setClientes(data);
    } else {
      const { data } = await supabase.from('proyectos').select(`*, clientes(nombre)`).order('created_at', { ascending: false });
      if (data) setProyectos(data);
    }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('clientes').insert([formCliente]);
    if (!error) {
      setShowClientModal(false);
      setFormCliente({ nombre: '', telefono: '', correo: '', direccion: '' });
      fetchData();
    } else {
      alert('Error al crear cliente: ' + error.message);
    }
  };

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('proyectos').insert([formProyecto]);
    if (!error) {
      setShowProjectModal(false);
      setFormProyecto({ cliente_id: '', vehiculo_id: '', titulo: '', descripcion: '' });
      fetchData();
    } else {
      alert('Error al crear proyecto: ' + error.message);
    }
  };

  // Variantes de animación para los modales
  const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalContent = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.3 } }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-6 md:p-12 w-full max-w-7xl mx-auto">
      
      {/* Header y Navegación */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <img src="/stathmos.png" alt="Stathmos Logo" className="w-32 dark:invert" />
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 border-l-2 border-[#D85A3A] pl-4">Panel de Control</h1>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('clientes')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'clientes' ? 'bg-[#7DBEBA] text-gray-900 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}>
            <Users size={18} /> Clientes
          </button>
          <button onClick={() => setActiveTab('proyectos')} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'proyectos' ? 'bg-[#7DBEBA] text-gray-900 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}>
            <Wrench size={18} /> Proyectos
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-100 dark:border-neutral-700 p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-800 dark:text-white">
            {activeTab === 'clientes' ? 'Directorio de Clientes' : 'Proyectos Activos'}
          </h2>
          <button 
            onClick={() => activeTab === 'clientes' ? setShowClientModal(true) : setShowProjectModal(true)}
            className="flex items-center gap-2 bg-[#D85A3A] hover:bg-[#c24f32] text-white px-4 py-2 rounded transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Nuevo {activeTab === 'clientes' ? 'Cliente' : 'Proyecto'}
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'clientes' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Teléfono</th>
                  <th className="pb-3 font-medium">Correo</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id} className="border-b border-gray-100 dark:border-neutral-700/50 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors text-gray-800 dark:text-gray-200">
                    <td className="py-4">{cliente.nombre}</td>
                    <td className="py-4">{cliente.telefono}</td>
                    <td className="py-4">{cliente.correo || '—'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${cliente.activo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Título</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Bloqueado</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map(proyecto => (
                  <tr key={proyecto.id} className="border-b border-gray-100 dark:border-neutral-700/50 hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors text-gray-800 dark:text-gray-200">
                    <td className="py-4 font-medium">{proyecto.titulo}</td>
                    <td className="py-4">{proyecto.clientes?.nombre || '—'}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 rounded bg-[#7DBEBA]/20 text-[#3B7A7A] dark:text-[#9DE0D8] text-xs uppercase tracking-wider font-semibold">
                        {proyecto.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4">
                      {proyecto.bloqueado ? <span className="text-red-500 text-sm">Sí (Sin pago)</span> : <span className="text-gray-400 text-sm">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- MODAL NUEVO CLIENTE --- */}
      <AnimatePresence>
        {showClientModal && (
          <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-neutral-700">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-700">
                <h3 className="text-xl font-medium text-gray-800 dark:text-white">Registrar Nuevo Cliente</h3>
                <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleCrearCliente} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
                  <input type="text" required value={formCliente.nombre} onChange={e => setFormCliente({...formCliente, nombre: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono *</label>
                  <input type="tel" required value={formCliente.telefono} onChange={e => setFormCliente({...formCliente, telefono: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                  <input type="email" value={formCliente.correo} onChange={e => setFormCliente({...formCliente, correo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                  <input type="text" value={formCliente.direccion} onChange={e => setFormCliente({...formCliente, direccion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowClientModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-colors">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-[#D85A3A] hover:bg-[#c24f32] text-white rounded-md transition-colors font-medium">Guardar Cliente</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL NUEVO PROYECTO --- */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div variants={modalBackdrop} initial="hidden" animate="visible" exit="hidden" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div variants={modalContent} className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-neutral-700">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-700">
                <h3 className="text-xl font-medium text-gray-800 dark:text-white">Aperturar Proyecto</h3>
                <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleCrearProyecto} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente *</label>
                  <select required value={formProyecto.cliente_id} onChange={e => setFormProyecto({...formProyecto, cliente_id: e.target.value, vehiculo_id: ''})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-white dark:bg-neutral-800 dark:text-white">
                    <option value="">Seleccione un cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo del Cliente *</label>
                  <select required value={formProyecto.vehiculo_id} onChange={e => setFormProyecto({...formProyecto, vehiculo_id: e.target.value})} disabled={!formProyecto.cliente_id || vehiculosDisponibles.length === 0} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-white dark:bg-neutral-800 dark:text-white disabled:opacity-50">
                    <option value="">
                      {!formProyecto.cliente_id ? 'Primero seleccione un cliente' : vehiculosDisponibles.length === 0 ? 'Este cliente no tiene vehículos' : 'Seleccione el vehículo...'}
                    </option>
                    {vehiculosDisponibles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.placas}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Proyecto *</label>
                  <input type="text" required placeholder="Ej: Afinación Mayor" value={formProyecto.titulo} onChange={e => setFormProyecto({...formProyecto, titulo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción Inicial</label>
                  <textarea rows="3" value={formProyecto.descripcion} onChange={e => setFormProyecto({...formProyecto, descripcion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7DBEBA] bg-transparent dark:text-white resize-none"></textarea>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-colors">Cancelar</button>
                  <button type="submit" disabled={!formProyecto.vehiculo_id} className="px-4 py-2 bg-[#D85A3A] hover:bg-[#c24f32] text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    Aperturar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    return () => subscription.unsubscribe();
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 transition-colors duration-300 font-sans">
      {session && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-4 z-50">
          <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" title="Alternar Tema">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!session ? (
          <Login key="login" onLoginSuccess={() => setSession(true)} />
        ) : (
          <Dashboard key="dashboard" onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </div>
  );
}