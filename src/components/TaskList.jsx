import { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import TaskCard from './TaskCard.jsx';

export default function TaskList({ tasks, onEdit, onDelete, onComplete }) {
  const [searchTerm, setSearchTerm] = useState('');

  const pendingTasks = tasks
    .filter(t => t.status !== 'Completado' && t.status !== 'Cancelado')
    .filter(t => t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const completedTasks = tasks
    .filter(t => t.status === 'Completado' || t.status === 'Cancelado')
    .filter(t => t.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mantenimientos</h2>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pendientes ({pendingTasks.length})</h3>
        <div className="space-y-3">
          {pendingTasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} onComplete={() => onComplete(task.id)} />
          ))}
          {pendingTasks.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
              <p>No hay mantenimientos pendientes.</p>
            </div>
          )}
        </div>
      </div>
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Completados / Cancelados ({completedTasks.length})</h3>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} onComplete={() => onComplete(task.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}