import { useState } from 'react';
import { AlertCircle, Clock, Calendar, Bell, BellOff, CheckCircle, Phone, MapPin, Wrench, X, FileText, User } from 'lucide-react';
import StatCard from './StatCard.jsx';

export default function Dashboard({ tasks, onNavigate, notificationPermission, onRequestNotifications, onShowAlerts, user }) {
  const [activeFilter, setActiveFilter] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
  const urgentTasks = pendingTasks.filter(t => t.urgency === 'Alta');
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate === today);
  const overdueTasks = pendingTasks.filter(t => t.dueDate < today);
  const alertTasks = [...new Map([...overdueTasks, ...urgentTasks, ...dueTodayTasks].map(t => [t.id, t])).values()];

  const filteredTasks = () => {
    switch (activeFilter) {
      case 'pendientes': return pendingTasks;
      case 'urgentes':   return urgentTasks;
      case 'hoy':        return dueTodayTasks;
      case 'atrasados':  return overdueTasks;
      default:           return alertTasks;
    }
  };

  const filterLabels = {
    pendientes: 'Pendientes',
    urgentes:   'Urgentes',
    hoy:        'Para Hoy',
    atrasados:  'Atrasados',
  };

  const handleFilter = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-EC', {
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
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            <AlertCircle size={18} />
            <span>Ver alertas {alertTasks.length > 0 && `(${alertTasks.length})`}</span>
          </button>
          <button
            onClick={onRequestNotifications}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              notificationPermission === 'granted'
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
            <span>{notificationPermission === 'granted' ? 'Alertas Activadas' : 'Activar Alertas'}</span>
          </button>
        </div>
      </div>

      {/* Banner alertas desactivadas */}
      {notificationPermission !== 'granted' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellOff size={20} className="text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Alertas del sistema desactivadas</p>
              <p className="text-xs text-yellow-600">Activa las notificaciones para recibir avisos fuera de la app</p>
            </div>
          </div>
          <button
            onClick={onRequestNotifications}
            className="text-xs font-semibold bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Activar
          </button>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => handleFilter('pendientes')} className="cursor-pointer">
          <StatCard title="Pendientes" count={pendingTasks.length} icon={<Clock />} color="text-yellow-600" bg="bg-yellow-100" isActive={activeFilter === 'pendientes'} />
        </div>
        <div onClick={() => handleFilter('urgentes')} className="cursor-pointer">
          <StatCard title="Urgentes" count={urgentTasks.length} icon={<AlertCircle />} color="text-red-600" bg="bg-red-100" isActive={activeFilter === 'urgentes'} />
        </div>
        <div onClick={() => handleFilter('hoy')} className="cursor-pointer">
          <StatCard title="Para Hoy" count={dueTodayTasks.length} icon={<Calendar />} color="text-blue-600" bg="bg-blue-100" isActive={activeFilter === 'hoy'} />
        </div>
        <div onClick={() => handleFilter('atrasados')} className="cursor-pointer">
          <StatCard title="Atrasados" count={overdueTasks.length} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" isActive={activeFilter === 'atrasados'} />
        </div>
      </div>

      {/* Panel de tareas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-slate-800">
              {activeFilter ? filterLabels[activeFilter] : 'Urgentes / Atrasados / Hoy'}
            </h3>
            {filteredTasks().length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                {filteredTasks().length}
              </span>
            )}
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors"
              >
                <X size={12} /><span>Limpiar filtro</span>
              </button>
            )}
          </div>
          <button onClick={() => onNavigate('list')} className="text-sm text-blue-600 font-medium hover:underline">
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {filteredTasks().map(task => {
            const isOverdue = task.dueDate < today;
            const isToday = task.dueDate === today;

            return (
              <div
                key={task.id}
                className={`rounded-xl border p-4 ${
                  isOverdue ? 'bg-red-50 border-red-200' :
                  isToday ? 'bg-blue-50 border-blue-200' :
                  activeFilter === 'pendientes' ? 'bg-slate-50 border-slate-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                {/* Fila superior — nombre + badges */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      isOverdue ? 'bg-red-100 text-red-600' :
                      isToday ? 'bg-blue-100 text-blue-600' :
                      activeFilter === 'pendientes' ? 'bg-slate-100 text-slate-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {isOverdue ? <AlertCircle size={16} /> :
                       isToday ? <Calendar size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{task.clientName}</p>
                      <p className="text-xs text-slate-500">{task.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                    {isOverdue && <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">Atrasado</span>}
                    {isToday && !isOverdue && <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">Hoy</span>}
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                      task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{task.urgency}</span>
                  </div>
                </div>

                {/* Orden de servicio — destacada */}
                {task.serviceOrder && (
                  <div className="mb-3">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-mono font-bold tracking-wider border border-purple-200">
                      <FileText size={12} />
                      <span>OS: {task.serviceOrder}</span>
                    </span>
                  </div>
                )}

                {/* Detalles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-2">
                  {task.equipment && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <Wrench size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{task.equipment}</span>
                    </div>
                  )}
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

                  {/* Fecha de vencimiento — destacada */}
                  <div className="flex items-center space-x-1.5 md:col-span-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-orange-100 text-orange-700 border-orange-300'
                    }`}>
                      <Calendar size={12} />
                      <span>Vence: {task.dueDate}{isOverdue ? ' — ATRASADO' : isToday ? ' — HOY' : ''}</span>
                    </span>
                  </div>
                </div>

                {/* Observaciones */}
                {task.observations && (
                  <div className="mt-2 p-2 bg-white bg-opacity-60 rounded-lg border border-slate-200 border-opacity-50">
                    <p className="text-xs text-slate-500 italic">📝 {task.observations}</p>
                  </div>
                )}

                {/* Footer — fecha creación y usuario */}
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

          {filteredTasks().length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
              <p>No hay tareas en esta categoría.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}