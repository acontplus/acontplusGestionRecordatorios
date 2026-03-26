import { Phone, MapPin, Calendar, Edit, Trash2, CheckCircle, FileText, Wrench, Clock, User } from 'lucide-react';

const statusColors = {
  'Pendiente':  'bg-yellow-100 text-yellow-700',
  'En Proceso': 'bg-blue-100 text-blue-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado':  'bg-slate-100 text-slate-500',
};

export default function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < today && task.status !== 'Completado' && task.status !== 'Cancelado';

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isOverdue ? 'border-red-200' : 'border-slate-100'}`}>

      {/* Cabecera */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 truncate">{task.clientName}</h4>
          <p className="text-sm text-slate-500">{task.type}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${statusColors[task.status] || 'bg-slate-100 text-slate-500'}`}>
          {task.status}
        </span>
      </div>

      {/* Orden de servicio — destacada en púrpura */}
      {task.serviceOrder && (
        <div className="mb-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono font-bold tracking-wider border border-purple-200">
            <FileText size={12} />
            <span>OS: {task.serviceOrder}</span>
          </span>
        </div>
      )}

      {/* Detalles */}
      <div className="space-y-1.5 mb-3">
        {task.equipment && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Wrench size={12} className="flex-shrink-0 text-slate-400" />
            <span className="truncate">{task.equipment}</span>
          </div>
        )}
        {task.clientPhone && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Phone size={12} className="flex-shrink-0 text-slate-400" />
            <span>{task.clientPhone}</span>
          </div>
        )}
        {task.clientAddress && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <MapPin size={12} className="flex-shrink-0 text-slate-400" />
            <span className="truncate">{task.clientAddress}</span>
          </div>
        )}

        {/* Fecha de vencimiento — destacada */}
        <div className="flex items-center">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
            isOverdue
              ? 'bg-red-100 text-red-700 border-red-300'
              : task.dueDate === today
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-orange-100 text-orange-700 border-orange-300'
          }`}>
            <Calendar size={12} />
            <span>
              Vence: {task.dueDate}
              {isOverdue ? ' — ATRASADO' : task.dueDate === today ? ' — HOY' : ''}
            </span>
          </span>
        </div>

        {/* Observaciones */}
        {task.observations && (
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-400 italic">📝 {task.observations}</p>
          </div>
        )}
      </div>

      {/* Footer — fecha creación y usuario */}
      <div className="py-2 border-t border-b border-slate-100 mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          <Clock size={11} />
          <span>{formatDate(task.createdAt)}</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          <User size={11} />
          <span className="truncate max-w-32">{task.createdBy || '—'}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
            <Edit size={18} />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
            <Trash2 size={18} />
          </button>
        </div>
        {task.status !== 'Completado' && task.status !== 'Cancelado' && (
          <button onClick={onComplete} className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm rounded-lg transition-colors">
            <CheckCircle size={16} /><span>Completar</span>
          </button>
        )}
      </div>
    </div>
  );
}