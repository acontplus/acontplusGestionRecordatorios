import { useState } from 'react';
import { X, Plus, Clock, CheckCircle, Calendar, Trash2, User } from 'lucide-react';
import { useVisits } from '../hooks/useVisits';

const TASK_TYPES = [
  'Mantenimiento preventivo',
  'Mantenimiento correctivo',
  'Instalación',
  'Revisión técnica',
  'Cambio de filtros',
  'Limpieza de equipo',
  'Otro',
];

const URGENCIES = ['Alta', 'Media', 'Baja'];

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Formulario nueva visita ───────────────────────────────────────────────
function AddVisitForm({ onAdd, onCancel, currentUser }) {
  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    // ✅ 1. dueDate ELIMINADO del estado inicial
    type: TASK_TYPES[0],
    urgency: 'Media',
    visitStatus: 'Pendiente',
    observations: '',
    technician: currentUser?.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onAdd(formData);
    setIsLoading(false);
  };

  const inputClass = "w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <form onSubmit={handleSubmit} className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#D61672' }}>
          ➕ Nueva visita programada
        </p>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}><Calendar size={11} className="inline mr-1" />Fecha visita</label>
            <input type="date" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} required
              className={inputClass}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <div>
            <label className={labelClass}><Clock size={11} className="inline mr-1" />Hora</label>
            <input type="time" name="scheduledTime" value={formData.scheduledTime} onChange={handleChange}
              className={inputClass}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        </div>

        {/* ✅ 1. Campo Fecha Límite ELIMINADO del formulario */}

        {/* Tipo y urgencia */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipo de visita</label>
            <select name="type" value={formData.type} onChange={handleChange}
              className={`${inputClass} bg-white`}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
              {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Urgencia</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange}
              className={`${inputClass} bg-white`}
              onFocus={e => e.target.style.borderColor = '#D61672'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
              {URGENCIES.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Estado visita */}
        <div>
          <label className={labelClass}>Estado de la visita</label>
          <select name="visitStatus" value={formData.visitStatus} onChange={handleChange}
            className={`${inputClass} bg-white`}
            onFocus={e => e.target.style.borderColor = '#D61672'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
            <option value="Pendiente">Pendiente</option>
            <option value="En camino">En camino</option>
            <option value="En sitio">En sitio</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>

        {/* Técnico */}
        <div>
          <label className={labelClass}><User size={11} className="inline mr-1" />Técnico asignado</label>
          <input type="text" name="technician" value={formData.technician} onChange={handleChange}
            placeholder="Email o nombre del técnico"
            className={inputClass}
            onFocus={e => e.target.style.borderColor = '#D61672'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Observaciones */}
        <div>
          <label className={labelClass}>Observaciones</label>
          <textarea name="observations" value={formData.observations} onChange={handleChange} rows={2}
            placeholder="Descripción del trabajo a realizar..."
            className={`${inputClass} resize-none`}
            onFocus={e => e.target.style.borderColor = '#D61672'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        </div>

        {/* Botones */}
        <div className="flex space-x-2 pt-1">
          <button type="submit" disabled={isLoading}
            className="flex-1 text-white text-xs font-bold py-2.5 rounded-lg disabled:opacity-50 transition-all"
            style={{ background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #D61672, #FFA901)' }}>
            {isLoading ? 'Guardando...' : 'Agregar visita'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Item de visita ────────────────────────────────────────────────────────
function VisitItem({ visit, onComplete, onCancel, onDelete }) {
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closingObs, setClosingObs] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    await onComplete(visit.id, { closingObservations: closingObs });
    setIsLoading(false);
    setShowCloseForm(false);
  };

  const bgColor =
    visit.status === 'Realizada' ? 'bg-green-50 border-green-200' :
    visit.status === 'Cancelada' ? 'bg-slate-100 border-slate-200' :
    'bg-blue-50 border-blue-200';

  return (
    <div className={`rounded-xl border-2 p-3 ${bgColor}`}>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              visit.status === 'Realizada' ? 'bg-green-100 text-green-700' :
              visit.status === 'Cancelada' ? 'bg-slate-200 text-slate-500' :
              'bg-blue-100 text-blue-700'
            }`}>{visit.status}</span>
            {visit.urgency && (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                visit.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                visit.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-600'
              }`}>{visit.urgency}</span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800 mt-1">
            📅 {formatDateOnly(visit.scheduledDate)}
            {visit.scheduledTime && <span className="text-slate-500 font-normal"> · {visit.scheduledTime}</span>}
          </p>
          {/* ✅ 4. Tipo de visita visible en el item */}
          {visit.type && <p className="text-xs text-slate-600 mt-0.5">🔧 {visit.type}</p>}
          {visit.technician && <p className="text-xs text-slate-500">👤 {visit.technician}</p>}
        </div>

        {/* Acciones */}
        {visit.status === 'Programada' && (
          <div className="flex space-x-1 ml-2 flex-shrink-0">
            <button onClick={() => setShowCloseForm(!showCloseForm)}
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors" title="Marcar realizada">
              <CheckCircle size={15} />
            </button>
            <button onClick={() => onCancel(visit.id)}
              className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors" title="Cancelar visita">
              <X size={15} />
            </button>
            <button onClick={() => onDelete(visit.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ✅ 4. Observaciones de la visita visibles en el item */}
      {visit.observations && (
        <div className="mb-2 p-2 bg-white bg-opacity-70 rounded-lg border border-white">
          <p className="text-xs text-slate-500">📝 {visit.observations}</p>
        </div>
      )}

      {/* Formulario cierre */}
      {showCloseForm && visit.status === 'Programada' && (
        <div className="mt-3 pt-3 border-t border-white space-y-2">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Observación de cierre <span className="text-slate-400 font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            value={closingObs}
            onChange={(e) => setClosingObs(e.target.value)}
            rows={2}
            placeholder="Describe el trabajo realizado..."
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            autoFocus
          />
          <div className="flex space-x-2">
            <button onClick={handleComplete} disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              <CheckCircle size={13} />
              <span>{isLoading ? 'Guardando...' : 'Confirmar realizada'}</span>
            </button>
            <button onClick={() => setShowCloseForm(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Datos de cierre */}
      {visit.status === 'Realizada' && visit.completedAt && (
        <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
          <div className="flex items-center justify-between text-xs text-green-600">
            <span>✅ {formatDate(visit.completedAt)}</span>
            <span>{visit.completedBy}</span>
          </div>
          {visit.closingObservations && (
            <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2">{visit.closingObservations}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal principal ───────────────────────────────────────────────────────
export default function VisitsModal({ task, user, onClose }) {
  const { visits, isLoading, addVisit, completeVisit, cancelVisit, deleteVisit } = useVisits(task, user);
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = new Date(a.scheduledDate + 'T' + (a.scheduledTime || '00:00'));
    const dateB = new Date(b.scheduledDate + 'T' + (b.scheduledTime || '00:00'));
    return dateB - dateA;
  });

  const pendingCount = visits.filter(v => v.status === 'Programada').length;
  const completedCount = visits.filter(v => v.status === 'Realizada').length;

  const handleAdd = async (data) => {
    const success = await addVisit(data);
    if (success) setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-md flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-lg">Visitas programadas</h3>
              <p className="text-xs text-white text-opacity-80 mt-0.5 truncate">{task.clientName}</p>
            </div>
            <button onClick={onClose}
              className="p-2 text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors ml-2 flex-shrink-0">
              <X size={20} />
            </button>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-1.5 bg-white bg-opacity-20 rounded-lg px-3 py-1.5">
              <Clock size={13} className="text-white" />
              <span className="text-xs text-white font-semibold">{pendingCount} programadas</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white bg-opacity-20 rounded-lg px-3 py-1.5">
              <CheckCircle size={13} className="text-white" />
              <span className="text-xs text-white font-semibold">{completedCount} realizadas</span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100">
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
                <Plus size={16} /><span>Agregar visita</span>
              </button>
            ) : (
              <AddVisitForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} currentUser={user} />
            )}
          </div>

          <div className="p-4 space-y-3">
            {isLoading && <div className="text-center py-4 text-slate-400 text-sm">Guardando...</div>}
            {sortedVisits.length === 0 && !showAddForm && (
              <div className="text-center py-12 text-slate-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Sin visitas programadas</p>
                <p className="text-xs mt-1">Agrega la primera visita arriba</p>
              </div>
            )}
            {sortedVisits.map(visit => (
              <VisitItem key={visit.id} visit={visit}
                onComplete={completeVisit} onCancel={cancelVisit} onDelete={deleteVisit} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            {visits.length} visita{visits.length !== 1 ? 's' : ''} en total
          </p>
        </div>
      </div>
    </div>
  );
}