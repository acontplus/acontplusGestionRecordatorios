import { Phone, MapPin, Calendar, Edit, Trash2, CheckCircle } from 'lucide-react';

const statusColors = {
  'Pendiente': 'bg-yellow-100 text-yellow-700',
  'En Proceso': 'bg-blue-100 text-blue-700',
  'Completado': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-slate-100 text-slate-500',
};

export default function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < today && task.status !== 'Completado' && task.status !== 'Cancelado';

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${isOverdue ? 'border-red-200' : 'border-slate-100'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-slate-800">{task.clientName}</h4>
          <p className="text-sm text-slate-500">{task.type}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status] || 'bg-slate-100 text-slate-500'}`}>
          {task.status}
        </span>
      </div>
      <div className="space-y-1 mb-3">
        {task.clientPhone && (
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <Phone size={12} /><span>{task.clientPhone}</span>
          </p>
        )}
        {task.clientAddress && (
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <MapPin size={12} /><span>{task.clientAddress}</span>
          </p>
        )}
        <p className={`text-xs flex items-center space-x-1 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
          <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-slate-400'} />
          <span>Para: {task.dueDate} {isOverdue && '(Atrasado)'}</span>
        </p>
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
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