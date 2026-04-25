import { useState } from 'react';
import supabase from '../supabase';

export default function RegistroCliente() {
  const [formData, setFormData] = useState({
    nombre: '', correo: '', telefono: '', rfc: '', direccion: ''
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'rfc' ? value.toUpperCase() : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      setStatus({ loading: false, error: "Nombre requerido", success: false });
      return;
    }
    
    // Validar email
    if (!formData.correo.trim()) {
      setStatus({ loading: false, error: "Correo requerido", success: false });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setStatus({ loading: false, error: "Correo no válido", success: false });
      return;
    }
    
    // Validar teléfono
    if (!formData.telefono.trim()) {
      setStatus({ loading: false, error: "Teléfono requerido", success: false });
      return;
    }
    
    // Validar RFC si se proporciona
    if (formData.rfc) {
      const rfcRegex = /^[A-ZÑ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]?$/;
      if (!rfcRegex.test(formData.rfc.toUpperCase())) {
        setStatus({ loading: false, error: "RFC no válido (ej: GARC800101ABC)", success: false });
        return;
      }
    }

    setStatus({ loading: true, error: null, success: false });

    const { data, error } = await supabase.functions.invoke('crear-cliente', {
      body: formData
    });

    if (error || !data?.success) {
      setStatus({ loading: false, error: error?.message || data?.error, success: false });
    } else {
      setStatus({ loading: false, error: null, success: true });
      setFormData({ nombre: '', correo: '', telefono: '', rfc: '', direccion: '' });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-[#60aebb] mb-6">Registrar Cliente</h2>

      {status.success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Cliente registrado. Se envió correo a <strong>{formData.correo}</strong>.
        </div>
      )}
      {status.error && (
        <div className="mb-4 p-3 bg-red-100 text-[#db3c1c] rounded">
          {status.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          required 
          type="text" 
          name="nombre" 
          placeholder="Nombre completo"
          value={formData.nombre} 
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" 
        />
        <input 
          required 
          type="email" 
          name="correo" 
          placeholder="Correo electrónico"
          value={formData.correo} 
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" 
        />
        <input 
          required 
          type="text" 
          name="telefono" 
          placeholder="Teléfono"
          value={formData.telefono} 
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" 
        />
        <input 
          type="text" 
          name="rfc" 
          placeholder="RFC (opcional)"
          value={formData.rfc} 
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none uppercase font-mono" 
        />
        <input 
          type="text" 
          name="direccion" 
          placeholder="Dirección (opcional)"
          value={formData.direccion} 
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" 
        />

        <button 
          disabled={status.loading} 
          type="submit"
          className="w-full bg-[#db3c1c] hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {status.loading ? 'Registrando...' : 'Registrar Cliente'}
        </button>
      </form>
    </div>
  );
}