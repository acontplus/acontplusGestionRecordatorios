import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';

export default function Reports({ tasks }) {
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterUrgency, setFilterUrgency] = useState('Todos');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus !== 'Todos' && t.status !== filterStatus) return false;
      if (filterUrgency !== 'Todos' && t.urgency !== filterUrgency) return false;
      return true;
    }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  }, [tasks, filterStatus, filterUrgency]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Reporte de Mantenimientos</h2>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center text-slate-500 font-medium">
          <Filter size={18} className="mr-2" /> Filtros:
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Todos">Todas las urgencias</option>
          <option value="Alta">Urgencia Alta</option>
          <option value="Media">Urgencia Media</option>
          <option value="Baja">Urgencia Baja</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">OS</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Urgencia</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-500">
                      {task.serviceOrder || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{task.clientName}</td>
                  <td className="px-4 py-3 text-slate-500">{task.type}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{task.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                      task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'Completado' ? 'bg-green-100 text-green-700' :
                      task.status === 'Cancelado' ? 'bg-slate-100 text-slate-500' :
                      task.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No hay registros con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}