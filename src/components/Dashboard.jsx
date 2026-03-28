import { useState } from 'react';
import { AlertCircle, Clock, Calendar, Bell, BellOff, CheckCircle, Phone, MapPin, X, FileText, User, Wrench } from 'lucide-react';
import StatCard from './StatCard.jsx';
import Pagination from './Pagination.jsx';
import { usePagination } from '../hooks/usePagination.js';

const URGENCY_ORDER = { 'Alta': 3, 'Media': 2, 'Baja': 1 };

// Obtiene la visita más cercana programada de una tarea
function getNextVisit(task) {
  if (!task.visits?.length) return null;
  const today = new Date().toISOString().split('T')[0];
  const pending = task.visits
    .filter(v => v.status === 'Programada')
    .sort((a, b) => {
      const dateA = a.scheduledDate;
      const dateB = b.scheduledDate;
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0);
    });
  return pending[0] || null;
}

// Enriquece una tarea con datos de su visita más cercana
function enrichTask(task) {
  const nextVisit = getNextVisit(task);
  return {
    ...task,
    _nextVisit: nextVisit,
    _dueDate: nextVisit?.dueDate || null,
    _urgency: nextVisit?.urgency || null,
    _type: nextVisit?.type || null,
    _technician: nextVisit?.technician || null,
  };
}

export default function Dashboard({ tasks, onNavigate, notificationPermission, onRequestNotifications, onShowAlerts, user }) {
  const [activeFilter, setActiveFilter] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  // Enriquecer todas las tareas
  const enrichedTasks = tasks
    .filter(t => t.status !== 'Completado' && t.status !== 'Cancelado')
    .map(enrichTask);

  // Tareas con visitas programadas (para contadores)
  const tasksWithVisits = enrichedTasks.filter(t => t._nextVisit !== null);

  // Contadores
  const overdueTasksAll = tasksWithVisits.filter(t => t._dueDate && t._dueDate < today);
  const dueTodayTasksAll = tasksWithVisits.filter(t => t._dueDate === today);
  const urgentTasksAll = tasksWithVisits.filter(t => t._urgency === 'Alta');

  // Panel: todas las tareas (con y sin visitas), ordenadas por fecha visita más cercana
  const allActiveTasks = enrichedTasks.sort((a, b) => {
    const dateA = a._dueDate || '9999-99-99';
    const dateB = b._dueDate || '9999-99-99';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (URGENCY_ORDER[b._urgency] || 0) - (URGENCY_ORDER[a._urgency] || 0);
  });

  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'pendientes': return tasksWithVisits;
      case 'urgentes':   return urgentTasksAll;
      case 'hoy':        return dueTodayTasksAll;
      case 'atrasados':  return overdueTasksAll;
      default:           return allActiveTasks;
    }
  };

  const filterLabels = {
    pendientes: 'Con visitas programadas',
    urgentes:   'Urgentes',
    hoy:        'Para Hoy',
    atrasados:  'Atrasados',
  };

  const handleFilter = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter);
    pagination.resetPage();
  };

  const pagination = usePagination(getFilteredTasks(), 5);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={onShowAlerts}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#fff0f7', color: '#D61672' }}
          >
            <AlertCircle size={18} />
            <span>Ver alertas {overdueTasksAll.length + urgentTasksAll.length > 0 && `(${new Set([...overdueTasksAll, ...urgentTasksAll].map(t => t.id)).size})`}</span>
          </button>
          <button
            onClick={onRequestNotifications}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              notificationPermission === 'granted' ? 'bg-pink-50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={notificationPermission === 'granted' ? { color: '#D61672' } : {}}
          >
            {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
            <span>{notificationPermission === 'granted' ? 'Alertas Activadas' : 'Activar Alertas'}</span>
          </button>
        </div>
      </div>

      {/* Banner alertas desactivadas */}
      {notificationPermission !== 'granted' && (
        <div className="border rounded-xl p-4 flex items-center justify-between" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="flex items-center space-x-3">
            <BellOff size={20} className="text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Alertas del sistema desactivadas</p>
              <p className="text-xs text-yellow-600">Activa las notificaciones para recibir avisos fuera de la app</p>
            </div>
          </div>
          <button onClick={onRequestNotifications}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
            style={{ background: '#d97706' }}>
            Activar
          </button>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => handleFilter('pendientes')} className="cursor-pointer">
          <StatCard title="Con visitas" count={tasksWithVisits.length} icon={<Clock />} color="text-yellow-600" bg="bg-yellow-100" isActive={activeFilter === 'pendientes'} />
        </div>
        <div onClick={() => handleFilter('urgentes')} className="cursor-pointer">
          <StatCard title="Urgentes" count={urgentTasksAll.length} icon={<AlertCircle />} color="text-red-600" bg="bg-red-100" isActive={activeFilter === 'urgentes'} />
        </div>
        <div onClick={() => handleFilter('hoy')} className="cursor-pointer">
          <StatCard title="Para Hoy" count={dueTodayTasksAll.length} icon={<Calendar />} color="text-blue-600" bg="bg-blue-100" isActive={activeFilter === 'hoy'} />
        </div>
        <div onClick={() => handleFilter('atrasados')} className="cursor-pointer">
          <StatCard title="Atrasados" count={overdueTasksAll.length} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" isActive={activeFilter === 'atrasados'} />
        </div>
      </div>

      {/* Panel de tareas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800">
              {activeFilter ? filterLabels[activeFilter] : 'Todas las tareas activas'}
            </h3>
            {getFilteredTasks().length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold text-white rounded-full" style={{ background: '#D61672' }}>
                {getFilteredTasks().length}
              </span>
            )}
            {activeFilter && (
              <button
                onClick={() => { setActiveFilter(null); pagination.resetPage(); }}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
              >
                <X size={12} /><span>Limpiar filtro</span>
              </button>
            )}
          </div>
          <button onClick={() => onNavigate('list')} className="text-sm font-medium hover:underline" style={{ color: '#D61672' }}>
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {pagination.paginatedItems.map(task => {
            const visit = task._nextVisit;
            const isOverdue = task._dueDate && task._dueDate < today;
            const isToday = task._dueDate === today;

            const cardBg = isOverdue ? 'bg-red-50 border-red-200' :
                           isToday ? 'bg-blue-50 border-blue-200' :
                           visit ? 'bg-pink-50 border-pink-100' :
                           'bg-slate-50 border-slate-200';

            return (
              <div key={task.id} className={`rounded-xl border p-4 ${cardBg}`}>

                {/* Fila superior */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      isOverdue ? 'bg-red-100 text-red-600' :
                      isToday ? 'bg-blue-100 text-blue-600' :
                      'bg-pink-100'
                    }`} style={!isOverdue && !isToday ? { color: '#D61672' } : {}}>
                      {isOverdue ? <AlertCircle size={16} /> : isToday ? <Calendar size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{task.clientName}</p>
                      {task.serviceOrder && (
                        <span className="inline-flex items-center space-x-1 text-xs font-mono font-semibold" style={{ color: '#7c3aed' }}>
                          <FileText size={10} /><span>OS: {task.serviceOrder}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    {isOverdue && <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">Atrasado</span>}
                    {isToday && !isOverdue && <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">Hoy</span>}
                    {task._urgency && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        task._urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                        task._urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{task._urgency}</span>
                    )}
                  </div>
                </div>

                {/* Info del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-3">
                  {task.clientPhone && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <Phone size={12} className="text-slate-400 flex-shrink-0" />
                      <span>{task.clientPhone}</span>
                    </div>
                  )}
                  {task.clientAddress && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 md:col-span-2">
                      <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{task.clientAddress}</span>
                    </div>
                  )}
                </div>

                {/* Info de la visita más cercana */}
                {visit && (
                  <div className="bg-white bg-opacity-70 rounded-lg border border-white p-3 space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#D61672' }}>
                      📅 Próxima visita
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Fecha visita */}
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                        <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="font-semibold">{visit.scheduledDate} {visit.scheduledTime && `— ${visit.scheduledTime}`}</span>
                      </div>

                      {/* Fecha límite */}
                      {visit.dueDate && (
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                            isOverdue ? 'bg-red-100 text-red-700 border-red-300' :
                            isToday ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            'bg-orange-100 text-orange-700 border-orange-300'
                          }`}>
                            <Calendar size={11} />
                            <span>Límite: {visit.dueDate}{isOverdue ? ' ⚠️' : isToday ? ' 📅' : ''}</span>
                          </span>
                        </div>
                      )}

                      {/* Tipo */}
                      {visit.type && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                          <Wrench size={12} className="text-slate-400 flex-shrink-0" />
                          <span>{visit.type}</span>
                        </div>
                      )}

                      {/* Técnico */}
                      {visit.technician && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                          <User size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{visit.technician}</span>
                        </div>
                      )}
                    </div>

                    {/* Observaciones de la visita */}
                    {visit.observations && (
                      <p className="text-xs text-slate-500 italic mt-1">📝 {visit.observations}</p>
                    )}
                  </div>
                )}

                {/* Sin visitas */}
                {!visit && (
                  <div className="bg-white bg-opacity-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-400">Sin visitas programadas</p>
                  </div>
                )}

                {/* Observaciones generales */}
                {task.observations && (
                  <div className="mt-2 p-2 bg-white bg-opacity-60 rounded-lg border border-slate-200 border-opacity-50">
                    <p className="text-xs text-slate-500 italic">📋 {task.observations}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 pt-2 border-t border-slate-200 border-opacity-60 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <Clock size={11} />
                    <span>Creado: {formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-slate-400">
                    <User size={11} />
                    <span className="truncate max-w-32">{task.createdBy || user?.email || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {getFilteredTasks().length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
              <p>No hay tareas en esta categoría.</p>
            </div>
          )}
        </div>

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
        />
      </div>
    </div>
  );
}