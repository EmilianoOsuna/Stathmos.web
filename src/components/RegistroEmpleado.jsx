import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Input, Button, DatePicker } from './UIPrimitives';

export default function RegistroEmpleado({ darkMode = false }) {
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
    <div className={`max-w-md mx-auto p-8 border rounded-lg shadow-sm ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"}`}>
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
        <Input required type="text" name="nombre" placeholder="Nombre completo"
          value={formData.nombre} onChange={handleChange} darkMode={darkMode} />
        <Input required type="email" name="correo" placeholder="Correo electrónico"
          value={formData.correo} onChange={handleChange} darkMode={darkMode} />
        <Input type="text" name="telefono" placeholder="Teléfono"
          value={formData.telefono} onChange={handleChange} darkMode={darkMode} />
        <Input required type="text" name="puesto" placeholder="Puesto (ej. Mecánico Sr.)"
          value={formData.puesto} onChange={handleChange} darkMode={darkMode} />
        <DatePicker
          value={formData.fecha_contratacion}
          onChange={(val) => setFormData(prev => ({ ...prev, fecha_contratacion: val }))}
          darkMode={darkMode}
          placeholder="Fecha de contratación..."
        />
        <Input required type="password" name="contraseña" placeholder="Contraseña de acceso"
          value={formData.contraseña} onChange={handleChange} darkMode={darkMode} />

        <Button disabled={status.loading} type="submit" variant="destructive" className="w-full mt-2">
          {status.loading ? 'Registrando...' : 'Crear Empleado'}
        </Button>
      </form>
    </div>
  );
}