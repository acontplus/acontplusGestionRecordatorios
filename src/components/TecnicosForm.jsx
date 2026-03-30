// src/components/TecnicosForm.jsx
import { useState } from 'react';
import { Plus, Trash2, User, X, Check, Mail } from 'lucide-react';
import { useTecnicos } from '../hooks/useTecnicos';

export default function TecnicosForm({ user, onClose }) {
  const { tecnicos, isLoading, addTecnico, deleteTecnico } = useTecnicos(user);
  const [form, setForm] = useState({ nombre: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    const existe = tecnicos.some(t => t.nombre.toLowerCase() === form.nombre.trim().toLowerCase());
    if (existe) e.nombre = 'Ya existe un técnico con ese nombre';
    return e;
  };

  const handleAdd = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const ok = await addTecnico({ nombre: form.nombre, email: form.email });
    if (ok) { setForm({ nombre: '', email: '' }); setErrors({}); }
    setSaving(false);
  };

  const handleChange = (field) => (ev) => {
    setForm(prev => ({ ...prev, [field]: ev.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleDelete = async (id) => {
    await deleteTecnico(id);
    setConfirmDelete(null);
  };

  const inp = "w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0"
        style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Técnicos</p>
              <p className="text-xs text-white" style={{ opacity: 0.8 }}>
                {tecnicos.length} técnico{tecnicos.length !== 1 ? 's' : ''} registrado{tecnicos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-white transition-colors"
            style={{ opacity: 0.8 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = 0.8; }}>
            <X size={20} />
          </button>
        </div>

        {/* Formulario para agregar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleAdd} className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
              Agregar técnico
            </label>

            {/* Nombre */}
            <div>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                  placeholder="Nombre completo del técnico"
                  className={`${inp} pl-9 ${errors.nombre ? 'border-red-400' : ''}`}
                  onFocus={e => e.target.style.borderColor = errors.nombre ? '#f87171' : '#2563eb'}
                  onBlur={e => e.target.style.borderColor = errors.nombre ? '#f87171' : '#e2e8f0'}
                  autoFocus
                />
              </div>
              {errors.nombre && (
                <p className="text-xs text-red-600 mt-1">⚠️ {errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="Email (opcional)"
                  className={`${inp} pl-9`}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !form.nombre.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {saving ? <><span className="animate-spin">⏳</span><span>Guardando...</span></> : <><Plus size={16} /><span>Agregar técnico</span></>}
            </button>
          </form>
        </div>

        {/* Lista de técnicos */}
        <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
          {isLoading && (
            <div className="text-center py-6 text-slate-400 text-sm">Cargando...</div>
          )}
          {tecnicos.length === 0 && !isLoading && (
            <div className="text-center py-10 text-slate-400">
              <User size={36} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">Sin técnicos registrados</p>
              <p className="text-xs mt-1">Agrega el primer técnico arriba</p>
            </div>
          )}
          <ul className="divide-y divide-slate-50">
            {tecnicos.map(t => (
              <li key={t.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 flex-shrink-0">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 font-semibold truncate">{t.nombre}</p>
                    {t.email && (
                      <p className="text-xs text-slate-400 truncate flex items-center space-x-1">
                        <Mail size={10} className="flex-shrink-0" />
                        <span>{t.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {confirmDelete === t.id ? (
                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-500">¿Eliminar?</span>
                    <button onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="Confirmar">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                      title="Cancelar">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(t.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
                    title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
