import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function RegistroEmpleado() {
  const [formData, setFormData] = useState({
    nombre: '', correo: '', telefono: '', puesto: '', fecha_contratacion: '', contraseña: ''
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    const { data, error } = await supabase.functions.invoke('crear-empleado', {
      body: formData
    });

    if (error || !data?.success) {
      setStatus({ loading: false, error: error?.message || data?.error, success: false });
    } else {
      setStatus({ loading: false, error: null, success: true });
      setFormData({ nombre: '', correo: '', telefono: '', puesto: '', fecha_contratacion: '', contraseña: '' });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-[#60aebb] mb-6">Registrar Empleado</h2>

      {status.success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Empleado registrado con éxito.
        </div>
      )}
      {status.error && (
        <div className="mb-4 p-3 bg-red-100 text-[#db3c1c] rounded">
          {status.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input required type="text" name="nombre" placeholder="Nombre completo"
          value={formData.nombre} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" />
        <input required type="email" name="correo" placeholder="Correo electrónico"
          value={formData.correo} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" />
        <input type="text" name="telefono" placeholder="Teléfono"
          value={formData.telefono} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" />
        <input required type="text" name="puesto" placeholder="Puesto (ej. Mecánico Sr.)"
          value={formData.puesto} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" />
        <input type="date" name="fecha_contratacion"
          value={formData.fecha_contratacion} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#60aebb] outline-none" />
        <input required type="password" name="contraseña" placeholder="Contraseña de acceso"
          value={formData.contraseña} onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-[#db3c1c] outline-none" />

        <button disabled={status.loading} type="submit"
          className="w-full bg-[#db3c1c] hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
          {status.loading ? 'Registrando...' : 'Crear Empleado'}
        </button>
      </form>
    </div>
  );
}