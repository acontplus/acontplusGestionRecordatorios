import { useState } from 'react';
import { Phone, MapPin, FileText, CreditCard, User, Package, Settings } from 'lucide-react';
import ClientSearch from './ClientSearch.jsx';
import ServiceTypesManager from './ServiceTypesManager.jsx';

export default function TaskForm({ onSubmit, initialData, statuses, onCancel, clients, serviceTypes, user }) {
  const [selectedClient, setSelectedClient] = useState(
    initialData?.clientId ? {
      id:             initialData.clientId,
      name:           initialData.clientName,
      phone:          initialData.clientPhone,
      address:        initialData.clientAddress,
      identification: initialData.identification,
    } : null
  );

  const [formData, setFormData] = useState(initialData || {
    serviceOrder:    '',
    identification:  '',
    clientName:      '',
    clientPhone:     '',
    clientAddress:   '',
    serviceType:     '',   // ← nuevo campo
    status:          'Pendiente',
    observations:    '',
  });

  const [errors,           setErrors]           = useState({});
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [showTypeManager,  setShowTypeManager]  = useState(false);

  // ── Handlers cliente ──────────────────────────────────────────────────────
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      clientId:       client.id,
      clientName:     client.name,
      clientPhone:    client.phone    || '',
      clientAddress:  client.address  || '',
      identification: client.identification || '',
    }));
    setErrors(prev => ({ ...prev, clientName: null }));
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setFormData(prev => ({
      ...prev,
      clientId:       '',
      clientName:     '',
      clientPhone:    '',
      clientAddress:  '',
      identification: '',
    }));
  };

  // ── Handler genérico ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── Validación ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.clientName?.trim())
      errs.clientName = 'Por favor ingresa o selecciona un cliente.';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide";

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
          <h2 className="text-lg font-bold">
            {initialData ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
          </h2>
          <p className="text-xs text-white text-opacity-80 mt-0.5">
            {initialData ? 'Modifica los datos de la tarea' : 'Registra una nueva tarea de mantenimiento'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Orden de servicio */}
          <div>
            <label className={labelClass}>
              <FileText size={12} className="inline mr-1" />Orden de Servicio
            </label>
            <input
              name="serviceOrder"
              value={formData.serviceOrder}
              onChange={handleChange}
              placeholder="Ej: OS-2026-001"
              className={`${inputClass} font-mono tracking-wide`}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Buscador de cliente */}
          <div>
            <label className={labelClass}>
              <User size={12} className="inline mr-1" />Cliente
            </label>
            <ClientSearch
              clients={clients}
              onSelect={handleSelectClient}
              selectedClient={selectedClient}
              onClear={handleClearClient}
            />
            {errors.clientName && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>⚠️</span><span>{errors.clientName}</span>
              </p>
            )}
          </div>

          {/* Campos nuevo cliente */}
          {!selectedClient && (
            <div className="space-y-4 p-4 bg-pink-50 rounded-xl border border-pink-100">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#D61672' }}>
                Datos del nuevo cliente
              </p>

              <div>
                <label className={labelClass}>
                  <CreditCard size={12} className="inline mr-1" />Cédula / RUC
                </label>
                <input
                  name="identification"
                  value={formData.identification}
                  onChange={handleChange}
                  placeholder="Ej: 0912345678"
                  className={`${inputClass} font-mono`}
                  onFocus={e => e.target.style.borderColor = '#D61672'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <User size={12} className="inline mr-1" />Nombre
                  </label>
                  <input
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    className={`${inputClass} ${errors.clientName ? 'border-red-400' : ''}`}
                    onFocus={e => e.target.style.borderColor = '#D61672'}
                    onBlur={e => e.target.style.borderColor = errors.clientName ? '#f87171' : '#e2e8f0'}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Phone size={12} className="inline mr-1" />Teléfono
                  </label>
                  <input
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    placeholder="Número de contacto"
                    className={inputClass}
                    onFocus={e => e.target.style.borderColor = '#D61672'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <MapPin size={12} className="inline mr-1" />Dirección
                </label>
                <input
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleChange}
                  placeholder="Dirección del cliente"
                  className={inputClass}
                  onFocus={e => e.target.style.borderColor = '#D61672'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          )}

          {/* ── NUEVO: Tipo de instalación / equipo / servicio ─────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>
                <Package size={12} className="inline mr-1" />Tipo de instalación / equipo / servicio
              </label>
              <button
                type="button"
                onClick={() => setShowTypeManager(true)}
                className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                style={{ color: '#D61672' }}
                title="Gestionar tipos"
              >
                <Settings size={11} />
                Gestionar tipos
              </button>
            </div>

            {serviceTypes && serviceTypes.length > 0 ? (
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className={`${inputClass} bg-white`}
                onFocus={e => e.target.style.borderColor = '#D61672'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">— Selecciona un tipo —</option>
                {serviceTypes.map(st => (
                  <option key={st.id} value={st.name}>{st.name}</option>
                ))}
              </select>
            ) : (
              /* Estado vacío: no hay tipos aún */
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                <Package size={18} className="text-slate-300 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">Sin tipos registrados</p>
                  <p className="text-xs text-slate-400">Crea tipos para poder seleccionarlos aquí</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTypeManager(true)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}
                >
                  + Agregar
                </button>
              </div>
            )}

            {/* Tipo actual si viene de edición y no está en la lista */}
            {formData.serviceType && serviceTypes && !serviceTypes.find(s => s.name === formData.serviceType) && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Tipo anterior: <strong>{formData.serviceType}</strong> — ya no está en la lista.
              </p>
            )}
          </div>
          {/* ────────────────────────────────────────────────────────────────── */}

          {/* Estado */}
          <div>
            <label className={labelClass}>Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${inputClass} bg-white`}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Observaciones generales */}
          <div>
            <label className={labelClass}>Observaciones generales</label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={3}
              placeholder="Descripción general del problema o trabajo..."
              className={`${inputClass} resize-none`}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #D61672, #FFA901)' }}
            >
              {isSubmitting ? 'Guardando...' : initialData ? '💾 Actualizar Tarea' : '✅ Guardar Tarea'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal gestión de tipos — z-index superior al formulario */}
      {showTypeManager && (
        <ServiceTypesManager
          user={user}
          onClose={() => setShowTypeManager(false)}
        />
      )}
    </>
  );
}
