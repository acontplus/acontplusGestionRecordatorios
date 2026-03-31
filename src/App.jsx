import { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { useClients } from './hooks/useClients';
import Login from './components/Login.jsx';
import NavItem from './components/NavItem.jsx';
import Dashboard from './components/Dashboard.jsx';
import TaskList from './components/TaskList.jsx';
import TaskForm from './components/TaskForm.jsx';
import Reports from './components/Reports.jsx';
import Toast from './components/Toast.jsx';
import CalendarView from './components/CalendarView.jsx';
import Configuracion from './components/Configuracion.jsx';
import { useConfiguracion } from './hooks/useConfiguracion.js';
import {
  Home, Wrench, FileText, Plus, Bell, BellOff,
  Cloud, CloudOff, LogOut, CalendarDays, Settings
} from 'lucide-react';

const STATUSES = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

export default function App() {
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [user,         setUser]         = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [editingTask,  setEditingTask]  = useState(null);
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);

  const { tasks, isLoadingTasks, addTask, deleteTask, markAsCompleted } = useTasks(user);
  // Sincroniza la config de empresa con el store global (usado por TaskPDF)
  useConfiguracion(user);
  const { clients, saveClient } = useClients(user);
  const {
    permission: notificationPermission,
    requestPermission: requestNotifications,
    toasts,
    removeToast,
    showAlerts,
  } = useNotifications(tasks);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Estado de red
  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddTask = async (task) => {
    if (task.identification && task.identification.trim() && task.clientName) {
      await saveClient(task);
    }
    const success = await addTask(task, user.email);
    if (success !== false) {
      setActiveTab('list');
      setEditingTask(null);
    } else {
      alert('Error al guardar la tarea. Verifica tu conexión o los permisos de la base de datos.');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setActiveTab('form');
  };

  if (isLoading || (isLoadingTasks && tasks.length === 0 && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <img src="/logo.png" alt="Acontplus" className="w-20 h-20 object-contain mb-4 animate-bounce" />
        <p className="text-sm font-semibold" style={{ color: '#D61672' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0 md:flex">

      {/* ── Navegación ── */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 md:relative md:w-64 md:border-t-0 md:border-r md:h-screen md:flex-shrink-0 z-10">
        <div className="flex justify-around p-2 md:flex-col md:p-6 md:space-y-2 md:h-full">

          {/* Logo — solo desktop */}
          <div className="hidden md:flex items-center space-x-3 mb-8 px-1">
            <img src="/logo.png" alt="Acontplus" className="w-10 h-10 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ color: '#D61672' }}>ACONTPLUS</h1>
              <p className="text-xs font-medium" style={{ color: '#FFA901' }}>Recordatorios</p>
            </div>
          </div>

          <NavItem icon={<Home />}        label="Panel"      isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wrench />}      label="Tareas"     isActive={activeTab === 'list'}      onClick={() => setActiveTab('list')} />
          <NavItem icon={<Plus />}        label="Nueva"      isActive={activeTab === 'form'}      onClick={() => { setEditingTask(null); setActiveTab('form'); }} />
          <NavItem icon={<CalendarDays />} label="Calendario" isActive={activeTab === 'calendar'}  onClick={() => setActiveTab('calendar')} />
          <NavItem icon={<FileText />}    label="Reportes"   isActive={activeTab === 'reports'}   onClick={() => setActiveTab('reports')} />

          {/* Configuración — solo desktop (icono de engranaje) */}
          <div className="hidden md:block">
            <NavItem
              icon={<Settings />}
              label="Configuración"
              isActive={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
            />
          </div>

          {/* Configuración — solo mobile */}
          <div className="block md:hidden">
            <NavItem
              icon={<Settings />}
              label="Config"
              isActive={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
            />
          </div>

          {/* Footer desktop: estado red + email + logout */}
          <div className="hidden md:flex md:flex-col md:mt-auto md:pt-4 md:border-t md:border-slate-100 space-y-2">

            {/* Indicador online/offline */}
            <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
              isOnline ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'
            }`}>
              {isOnline
                ? <><Cloud size={13} /><span>Online</span></>
                : <><CloudOff size={13} /><span>Sin conexión</span></>
              }
            </div>

            {/* Notificaciones */}
            <button
              onClick={requestNotifications}
              className={`flex items-center space-x-2 w-full p-2 rounded-lg text-xs font-medium transition-colors ${
                notificationPermission === 'granted'
                  ? 'text-white'
                  : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
              }`}
              style={notificationPermission === 'granted'
                ? { background: 'linear-gradient(135deg, #D61672, #FFA901)' }
                : {}}
              title={notificationPermission === 'granted' ? 'Alertas activadas' : 'Activar alertas'}
            >
              {notificationPermission === 'granted' ? <Bell size={14} /> : <BellOff size={14} />}
              <span>{notificationPermission === 'granted' ? 'Notificaciones ON' : 'Activar notif.'}</span>
            </button>

            <div className="text-xs text-slate-400 truncate px-2">{user.email}</div>

            <button
              onClick={() => signOut(auth)}
              className="flex items-center space-x-2 w-full px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Contenido principal ── */}
      <main className="flex-1 p-4 md:p-6 md:overflow-y-auto">

        {/* Barra superior móvil */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Acontplus" className="w-8 h-8 object-contain" />
            <span className="text-sm font-bold" style={{ color: '#D61672' }}>ACONTPLUS</span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Online badge mobile */}
            <span className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${
              isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {isOnline ? <Cloud size={11} /> : <CloudOff size={11} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>

            {/* Notificaciones mobile */}
            <button
              onClick={requestNotifications}
              className={`p-2 rounded-full transition-colors ${
                notificationPermission === 'granted' ? 'bg-pink-50' : 'text-slate-400 bg-slate-100'
              }`}
              style={notificationPermission === 'granted' ? { color: '#D61672' } : {}}
              title={notificationPermission === 'granted' ? 'Alertas activadas' : 'Activar alertas'}
            >
              {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
            </button>

            {/* Logout mobile */}
            <button
              onClick={() => signOut(auth)}
              className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* ── Vistas ── */}
        {activeTab === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            onNavigate={setActiveTab}
            notificationPermission={notificationPermission}
            onRequestNotifications={requestNotifications}
            onShowAlerts={showAlerts}
            user={user}
          />
        )}
        {activeTab === 'list' && (
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={deleteTask}
            onComplete={markAsCompleted}
            user={user}
          />
        )}
        {activeTab === 'form' && (
          <TaskForm
            onSubmit={handleAddTask}
            initialData={editingTask}
            statuses={STATUSES}
            onCancel={() => setActiveTab('list')}
            clients={clients}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView tasks={tasks} />
        )}
        {activeTab === 'reports' && (
          <Reports tasks={tasks} user={user} />
        )}
        {activeTab === 'config' && (
          <Configuracion user={user} />
        )}
      </main>

      {/* Toasts */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}
