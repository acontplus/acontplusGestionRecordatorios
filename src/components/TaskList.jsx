import { useState, useMemo } from 'react';
import { Search, CheckCircle, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import TaskCard from './TaskCard.jsx';
import CompleteModal from './CompleteModal.jsx';

const INITIAL_FILTERS = {
  search: '',
  status: 'Todos',
  serviceOrder: '',
  createdBy: '',
  dateFrom: '',
  dateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
};

export default function TaskList({ tasks, onEdit, onDelete, onComplete, user }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const activeFilterCount = Object.entries(filters).filter(([key, val]) =>
    key === 'status' ? val !== 'Todos' : val !== ''
  ).length;

  const uniqueUsers = useMemo(() => {
    const users = tasks.map(t => t.createdBy).filter(Boolean);
    return [...new Set(users)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.search && !task.clientName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.serviceOrder && !task.serviceOrder?.toLowerCase().includes(filters.serviceOrder.toLowerCase())) return false;
      if (filters.status !== 'Todos' && task.status !== filters.status) return false;
      if (filters.createdBy && task.createdBy !== filters.createdBy) return false;
      if (filters.dateFrom) {
        const created = task.createdAt?.split('T')[0];
        if (!created || created < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const created = task.createdAt?.split('T')[0];
        if (!created || created > filters.dateTo) return false;
      }
      if (filters.dueDateFrom && task.dueDate < filters.dueDateFrom) return false;
      if (filters.dueDateTo && task.dueDate > filters.dueDateTo) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, filters]);

  const pendingTasks = filteredTasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completado' || t.status === 'Cancelado');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Mantenimientos</h2>
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <span>{filteredTasks.length} de {tasks.length} registros</span>
        </div>
      </div>

      {/* Barra de búsqueda + botón filtros */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filters.search && (
            <button onClick={() => handleFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Filter size={16} />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Filtros avanzados</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <X size={12} /><span>Limpiar todos</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Orden de servicio</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: OS-2026-001"
                  value={filters.serviceOrder}
                  onChange={(e) => handleFilter('serviceOrder', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                {filters.serviceOrder && (
                  <button onClick={() => handleFilter('serviceOrder', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilter('status', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Usuario</label>
              <select
                value={filters.createdBy}
                onChange={(e) => handleFilter('createdBy', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los usuarios</option>
                {uniqueUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Creado desde</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilter('dateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.dateFrom && (
                  <button onClick={() => handleFilter('dateFrom', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Creado hasta</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilter('dateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.dateTo && (
                  <button onClick={() => handleFilter('dateTo', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vence desde</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dueDateFrom}
                  onChange={(e) => handleFilter('dueDateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.dueDateFrom && (
                  <button onClick={() => handleFilter('dueDateFrom', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vence hasta</label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dueDateTo}
                  onChange={(e) => handleFilter('dueDateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {filters.dueDateTo && (
                  <button onClick={() => handleFilter('dueDateTo', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tags de filtros activos */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {filters.status !== 'Todos' && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                  <span>Estado: {filters.status}</span>
                  <button onClick={() => handleFilter('status', 'Todos')}><X size={12} /></button>
                </span>
              )}
              {filters.serviceOrder && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                  <span>OS: {filters.serviceOrder}</span>
                  <button onClick={() => handleFilter('serviceOrder', '')}><X size={12} /></button>
                </span>
              )}
              {filters.createdBy && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                  <span>Usuario: {filters.createdBy}</span>
                  <button onClick={() => handleFilter('createdBy', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dateFrom && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  <span>Creado desde: {filters.dateFrom}</span>
                  <button onClick={() => handleFilter('dateFrom', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dateTo && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  <span>Creado hasta: {filters.dateTo}</span>
                  <button onClick={() => handleFilter('dateTo', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dueDateFrom && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  <span>Vence desde: {filters.dueDateFrom}</span>
                  <button onClick={() => handleFilter('dueDateFrom', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dueDateTo && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  <span>Vence hasta: {filters.dueDateTo}</span>
                  <button onClick={() => handleFilter('dueDateTo', '')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista pendientes */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Pendientes ({pendingTasks.length})
        </h3>
        <div className="space-y-3">
          {pendingTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
              onComplete={() => setCompletingTask(task)}
            />
          ))}
          {pendingTasks.length === 0 && (
            <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
              <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
              <p>No hay mantenimientos con estos filtros.</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista completados */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Completados / Cancelados ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task.id)}
                onComplete={() => setCompletingTask(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {completingTask && (
        <CompleteModal
          task={completingTask}
          user={user}
          onConfirm={async (completionData) => {
            await onComplete(completingTask.id, completionData);
            setCompletingTask(null);
          }}
          onCancel={() => setCompletingTask(null)}
        />
      )}
    </div>
  );
}