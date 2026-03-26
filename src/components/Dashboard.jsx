import { AlertCircle, Clock, Calendar, Bell, BellOff, CheckCircle } from 'lucide-react';
import StatCard from './StatCard.jsx';

export default function Dashboard({ tasks, onNavigate, notificationPermission, onRequestNotifications, onShowAlerts }) {
  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
  const urgentTasks = pendingTasks.filter(t => t.urgency === 'Alta');
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate === today);
  const overdueTasks = pendingTasks.filter(t => t.dueDate < today);
  const alertTasks = [...new Map([...overdueTasks, ...urgentTasks, ...dueTodayTasks].map(t => [t.id, t])).values()];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
        <div className="hidden md:flex items-center space-x-2">
          {/* Botón ver alertas */}
          <button
            onClick={onShowAlerts}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            <AlertCircle size={18} />
            <span>Ver alertas {alertTasks.length > 0 && `(${alertTasks.length})`}</span>
          </button>
          {/* Botón activar notificaciones */}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendientes" count={pendingTasks.length} icon={<Clock />} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard title="Urgentes" count={urgentTasks.length} icon={<AlertCircle />} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Para Hoy" count={dueTodayTasks.length} icon={<Calendar />} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Atrasados" count={overdueTasks.length} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" />
      </div>

      {/* Panel de alertas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Urgentes / Atrasados / Hoy</h3>
          <button onClick={() => onNavigate('list')} className="text-sm text-blue-600 font-medium hover:underline">Ver todos</button>
        </div>
        <div className="space-y-3">
          {alertTasks.slice(0, 8).map(task => {
            const isOverdue = task.dueDate < today;
            const isToday = task.dueDate === today;
            return (
              <div key={task.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full mt-0.5 ${
                    isOverdue ? 'bg-red-100 text-red-600' :
                    isToday ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {isOverdue ? <AlertCircle size={16} /> : isToday ? <Calendar size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{task.clientName}</p>
                    <p className="text-xs text-slate-500">{task.type} • {task.dueDate}</p>
                    {task.observations && (
                      <p className="text-xs text-slate-400 mt-1 italic">📝 {task.observations}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {isOverdue && <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Atrasado</span>}
                  {isToday && !isOverdue && <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Hoy</span>}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                    task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>{task.urgency}</span>
                </div>
              </div>
            );
          })}
          {alertTasks.length === 0 && (
            <div className="text-center py-6 text-slate-400">
              <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
              <p>No hay tareas urgentes ni atrasadas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}