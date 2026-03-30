import { useState } from 'react';
import {
  AlertCircle, Clock, Calendar, Bell, BellOff,
  CheckCircle, Phone, MapPin, X, FileText, User, Wrench
} from 'lucide-react';
import StatCard from './StatCard.jsx';
import Pagination from './Pagination.jsx';
import { usePagination } from '../hooks/usePagination.js';

const URGENCY_ORDER = { 'Alta': 3, 'Media': 2, 'Baja': 1 };

// ── Fecha local del navegador (no UTC — corrige bug Ecuador UTC-5) ──────────
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── Próxima visita programada de una tarea (para ordenar la lista) ─────────
function getNextVisit(task) {
  if (!task.visits?.length) return null;
  return task.visits
    .filter(v => v.status === 'Programada')
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
      return (URGENCY_ORDER[b.urgency] || 0) - (URGENCY_ORDER[a.urgency] || 0);
    })[0] || null;
}

// ── Enriquecer tarea con metadatos de visitas ──────────────────────────────
function enrichTask(task, today) {
  const programadas = (task.visits || []).filter(v => v.status === 'Programada');
  const nextVisit   = getNextVisit(task);

  // Visitas de hoy y retrasadas de esta tarea
  const todayVisits   = programadas.filter(v => v.scheduledDate === today);
  const overdueVisits = programadas.filter(v => v.scheduledDate < today);

  return {
    ...task,
    _nextVisit:     nextVisit,
    _scheduledDate: nextVisit?.scheduledDate || null,
    _urgency:       nextVisit?.urgency       || null,
    _programadas:   programadas,
    _todayVisits:   todayVisits,
    _overdueVisits: overdueVisits,
  };
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function Dashboard({ tasks, onNavigate, notificationPermission, onRequestNotifications, onShowAlerts, user }) {
  const [activeFilter, setActiveFilter] = useState(null);

  // Fecha local del navegador
  const today = getLocalDate();

  const enrichedTasks = tasks
    .filter(t => t.status !== 'Completado' && t.status !== 'Cancelado')
    .map(t => enrichTask(t, today));

  // ── Tareas con al menos una visita programada ──────────────────────────
  const tasksWithVisits = enrichedTasks.filter(t => t._programadas.length > 0);

  // ── Tareas con al menos una visita de urgencia Alta ───────────────────
  const urgentTasksAll = tasksWithVisits.filter(t =>
    t._programadas.some(v => v.urgency === 'Alta')
  );

  // ── Tareas con al menos una visita HOY ────────────────────────────────
  const dueTodayTasksAll = tasksWithVisits.filter(t => t._todayVisits.length > 0);

  // ── Tareas con al menos una visita RETRASADA ──────────────────────────
  const overdueTasksAll = tasksWithVisits.filter(t => t._overdueVisits.length > 0);

  // ── CONTADORES: total de visitas individuales (no tareas) ─────────────
  const totalVisitsWithSchedule = tasksWithVisits.reduce((sum, t) => sum + t._programadas.length, 0);
  const totalUrgentVisits       = tasksWithVisits.reduce((sum, t) => sum + t._programadas.filter(v => v.urgency === 'Alta').length, 0);
  const totalTodayVisits        = tasksWithVisits.reduce((sum, t) => sum + t._todayVisits.length, 0);
  const totalOverdueVisits      = tasksWithVisits.reduce((sum, t) => sum + t._overdueVisits.length, 0);

  // ── Ordenar todas las tareas activas por próxima visita ───────────────
  const allActiveTasks = [...enrichedTasks].sort((a, b) => {
    const dateA = a._scheduledDate || '9999-99-99';
    const dateB = b._scheduledDate || '9999-99-99';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (URGENCY_ORDER[b._urgency] || 0) - (URGENCY_ORDER[a._urgency] || 0);
  });

  const filterLabels = {
    pendientes: 'Con visitas programadas',
    urgentes:   'Visitas urgentes',
    hoy:        'Visitas para hoy',
    atrasados:  'Visitas retrasadas',
  };

  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'pendientes': return tasksWithVisits;
      case 'urgentes':   return urgentTasksAll;
      case 'hoy':        return dueTodayTasksAll;
      case 'atrasados':  return overdueTasksAll;
      default:           return allActiveTasks;
    }
  };

  const handleFilter = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  const filteredTasks = getFilteredTasks();
  const pagination = usePagination(filteredTasks, 10);

  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">Panel General</h2>
            <p className="text-xs text-slate-400 mt-0.5">Resumen de tareas activas</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowAlerts}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
              <Bell size={13} /><span>Ver alertas</span>
            </button>
            <button
              onClick={onRequestNotifications}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                notificationPermission === 'granted'
                  ? 'border-pink-200 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              style={notificationPermission === 'granted'
                ? { background: 'linear-gradient(135deg, #D61672, #FFA901)' }
                : {}}>
              {notificationPermission === 'granted' ? <Bell size={13} /> : <BellOff size={13} />}
              <span>{notificationPermission === 'granted' ? 'Notificaciones ON' : 'Activar notificaciones'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tarjetas estadísticas (cuentan VISITAS, no tareas) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Con visitas"
          count={totalVisitsWithSchedule}
          icon={<Clock size={20} />}
          color="text-yellow-600"
          bg="bg-yellow-100"
          isActive={activeFilter === 'pendientes'}
          onClick={() => handleFilter('pendientes')}
        />
        <StatCard
          title="Urgentes"
          count={totalUrgentVisits}
          icon={<AlertCircle size={20} />}
          color="text-red-600"
          bg="bg-red-100"
          isActive={activeFilter === 'urgentes'}
          onClick={() => handleFilter('urgentes')}
        />
        <StatCard
          title="Para Hoy"
          count={totalTodayVisits}
          icon={<Calendar size={20} />}
          color="text-blue-600"
          bg="bg-blue-100"
          isActive={activeFilter === 'hoy'}
          onClick={() => handleFilter('hoy')}
        />
        <StatCard
          title="Atrasados"
          count={totalOverdueVisits}
          icon={<AlertCircle size={20} />}
          color="text-orange-600"
          bg="bg-orange-100"
          isActive={activeFilter === 'atrasados'}
          onClick={() => handleFilter('atrasados')}
        />
      </div>

      {/* Lista de tareas */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-800">
              {activeFilter ? filterLabels[activeFilter] : 'Todas las tareas activas'}
            </h3>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white"
              style={{ background: '#D61672' }}>
              {filteredTasks.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={12} /><span>Limpiar filtro</span>
              </button>
            )}
            <button onClick={() => onNavigate('list')}
              className="text-xs font-semibold hover:underline" style={{ color: '#D61672' }}>
              Ver todos
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {pagination.paginatedItems.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Sin tareas en esta categoría</p>
            </div>
          )}

          {pagination.paginatedItems.map(task => {
            // Decidir qué visitas mostrar según el filtro activo
            const visitsToShow =
              activeFilter === 'hoy'       ? task._todayVisits :
              activeFilter === 'atrasados' ? task._overdueVisits :
              activeFilter === 'urgentes'  ? task._programadas.filter(v => v.urgency === 'Alta') :
              task._nextVisit              ? [task._nextVisit] : [];

            // Flag de borde lateral: si hay alguna visita retrasada o de hoy
            const hasOverdue = task._overdueVisits.length > 0;
            const hasToday   = task._todayVisits.length > 0;

            return (
              <div key={task.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  hasOverdue ? 'border-l-4 border-red-400' :
                  hasToday   ? 'border-l-4 border-blue-400' : ''
                }`}>

                {/* Cabecera: nombre + OS + estado */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h4 className="font-semibold text-slate-800 text-sm">{task.clientName}</h4>
                      {task.serviceOrder && (
                        <span className="inline-flex items-center space-x-1 text-xs font-mono font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          <FileText size={10} /><span>OS: {task.serviceOrder}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                    task.status === 'Pendiente'  ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>{task.status}</span>
                </div>

                {/* Info cliente */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                  {task.clientPhone && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <Phone size={11} className="text-slate-400 flex-shrink-0" />
                      <span>{task.clientPhone}</span>
                    </div>
                  )}
                  {task.clientAddress && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-xs">{task.clientAddress}</span>
                    </div>
                  )}
                </div>

                {/* ── Visitas a mostrar (pueden ser varias) ── */}
                {visitsToShow.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {visitsToShow.map((visit, idx) => {
                      const vIsOverdue = visit.scheduledDate < today;
                      const vIsToday   = visit.scheduledDate === today;

                      const blockBg =
                        vIsOverdue ? 'bg-red-50 border-red-200' :
                        vIsToday   ? 'bg-blue-50 border-blue-200' :
                        'bg-slate-50 border-slate-200';

                      const titleColor =
                        vIsOverdue ? 'text-red-600' :
                        vIsToday   ? 'text-blue-600' :
                        'text-slate-500';

                      return (
                        <div key={visit.id || idx} className={`rounded-lg border p-2.5 space-y-1.5 ${blockBg}`}>

                          {/* Título + etiquetas */}
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <p className={`text-xs font-bold uppercase tracking-wide ${titleColor}`}>
                              📅 {visitsToShow.length > 1 ? `Visita ${idx + 1}` : 'Próxima visita'}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {visit.urgency && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  visit.urgency === 'Alta'  ? 'bg-red-100 text-red-700' :
                                  visit.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{visit.urgency}</span>
                              )}
                              {vIsOverdue && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
                                  ⚠️ Retrasada
                                </span>
                              )}
                              {vIsToday && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-sm">
                                  📅 Hoy
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fecha + hora */}
                          <div className="flex items-center space-x-1.5 text-xs font-semibold">
                            <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                            <span className={vIsOverdue ? 'text-red-700 font-bold' : 'text-slate-700'}>
                              {formatDateOnly(visit.scheduledDate)}
                              {visit.scheduledTime && ` · ${visit.scheduledTime}`}
                            </span>
                          </div>

                          {/* Tipo */}
                          {visit.type && (
                            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                              <Wrench size={12} className="text-slate-400 flex-shrink-0" />
                              <span>{visit.type}</span>
                            </div>
                          )}

                          {/* Técnico */}
                          {visit.technician && (
                            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                              <User size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="truncate">{visit.technician}</span>
                            </div>
                          )}

                          {/* Observaciones */}
                          {visit.observations && (
                            <div className="mt-1 pt-1.5 border-t border-slate-200">
                              <p className="text-xs text-slate-500 italic">📝 {visit.observations}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-2 text-center mb-2">
                    <p className="text-xs text-slate-400">Sin visitas programadas</p>
                  </div>
                )}

                {/* Observaciones tarea */}
                {task.observations && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-xs text-slate-500 italic">📋 {task.observations}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock size={11} />
                    <span>{task.createdAt ? new Date(task.createdAt).toLocaleDateString('es-EC') : '—'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User size={11} />
                    <span className="truncate max-w-32">{task.createdBy || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length > 10 && (
          <div className="px-4 pb-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              totalItems={pagination.totalItems}
            />
          </div>
        )}
      </div>
    </div>
  );
}
