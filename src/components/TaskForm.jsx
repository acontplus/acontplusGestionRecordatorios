import { useState } from 'react';
import { Phone, MapPin, Calendar, FileText, Wrench, CreditCard, User } from 'lucide-react';
import ClientSearch from './ClientSearch.jsx';

export default function TaskForm({ onSubmit, initialData, types, urgencies, statuses, onCancel, clients }) {
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
    equipment: '',
    type: types[0],
    urgency: 'Media',
    status: 'Pendiente',
    dueDate: new Date().toISOString().split('T')[0],
    observations: ''
  });

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone || '',
      clientAddress: client.address || '',
      identification: client.identification,
    }));
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {initialData ? 'Editar Registro' : 'Nuevo Recordatorio'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Orden de servicio */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            <FileText size={14} className="inline mr-1" />Orden de Servicio
          </label>
          <input
            name="serviceOrder"
            value={formData.serviceOrder}
            onChange={handleChange}
            placeholder="Ej: OS-2026-001"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wide"
          />
        </div>

        {/* Buscador de cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            <User size={14} className="inline mr-1" />Cliente
          </label>
          <ClientSearch
            clients={clients}
            onSelect={handleSelectClient}
            selectedClient={selectedClient}
            onClear={handleClearClient}
          />
        </div>

        {/* Campos del cliente — visibles solo si no hay cliente seleccionado */}
        {!selectedClient && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Datos del nuevo cliente
            </p>

            {/* Cédula / RUC */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <CreditCard size={14} className="inline mr-1" />Cédula / RUC
              </label>
              <input
                name="identification"
                value={formData.identification}
                onChange={handleChange}
                placeholder="Ej: 0912345678 o 0912345678001"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  <User size={14} className="inline mr-1" />Nombre
                </label>
                <input
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  placeholder="Nombre completo"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  <Phone size={14} className="inline mr-1" />Teléfono
                </label>
                <input
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="Número de contacto"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <MapPin size={14} className="inline mr-1" />Dirección
              </label>
              <input
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleChange}
                placeholder="Dirección del cliente"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Equipo */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            <Wrench size={14} className="inline mr-1" />Equipo
          </label>
          <input
            name="equipment"
            value={formData.equipment}
            onChange={handleChange}
            placeholder="Modelo o descripción del equipo"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo, Urgencia, Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Urgencia</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {urgencies.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Fecha límite */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            <Calendar size={14} className="inline mr-1" />Fecha límite
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Observaciones</label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows={3}
            placeholder="Notas adicionales..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {initialData ? 'Actualizar Registro' : 'Guardar Recordatorio'}
          </button>
          {initialData && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}