import { useState } from 'react';
import { Phone, MapPin, FileText, CreditCard, User } from 'lucide-react';
import ClientSearch from './ClientSearch.jsx';

export default function TaskForm({ onSubmit, initialData, statuses, onCancel, clients }) {
  const [selectedClient, setSelectedClient] = useState(
    initialData?.clientId ? {
      id: initialData.clientId,
      name: initialData.clientName,
      phone: initialData.clientPhone,
      address: initialData.clientAddress,
      identification: initialData.identification,
    } : null
  );

  const [formData, setFormData] = useState(initialData || {
    serviceOrder: '',
    identification: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    status: 'Pendiente',
    observations: ''
  });

  const [errors, setErrors] = useState({});

  // ✅ CORREGIDO: se asegura que identification siempre se copie del cliente seleccionado
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || '',
      clientAddress: client.address || '',
      identification: client.identification || '',
    }));
    setErrors(prev => ({ ...prev, clientName: null }));
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setFormData(prev => ({
      ...prev,
      clientId: '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      identification: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.clientName || formData.clientName.trim() === '') {
      newErrors.clientName = 'Por favor ingresa o selecciona un cliente.';
    }
    return newErrors;
  };

  // ✅ CORREGIDO: se agrega isSubmitting para evitar doble envío y dar feedback visual
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
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

            {/* Cédula / RUC */}
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
            {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar Tarea' : 'Guardar Tarea'}
          </button>
          {initialData && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}