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
import { Home, Wrench, FileText, Plus, Droplet, Bell, BellOff, Cloud, CloudOff, LogOut } from 'lucide-react';

const TASK_TYPES = ['Cambio de Filtro', 'Mantenimiento General', 'Instalación', 'Revisión por Fuga', 'Garantía'];
const URGENCIES = ['Baja', 'Media', 'Alta'];
const STATUSES = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { tasks, isLoadingTasks, addTask, deleteTask, markAsCompleted } = useTasks(user);
  const { clients, saveClient } = useClients(user);
  const {
    permission: notificationPermission,
    requestPermission: requestNotifications,
    toasts,
    removeToast,
    showAlerts
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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAddTask = async (task) => {
    // Guardar cliente si tiene identificación y nombre
    if (task.identification && task.clientName) {
      await saveClient(task);
    }
    const success = await addTask(task, user.email);
    if (success !== false) {
      setActiveTab('list');
      setEditingTask(null);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setActiveTab('form');
  };

  if (isLoading || (isLoadingTasks && tasks.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Droplet size={48} className="text-blue-500 animate-bounce mb-4" />
        <p className="text-slate-500 font-medium">Cargando...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0 md:flex">

      {/* Navegación */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 md:relative md:w-64 md:border-t-0 md:border-r md:h-screen md:flex-shrink-0 z-10">
        <div className="flex justify-around p-3 md:flex-col md:p-6 md:space-y-4">
          <div className="hidden md:flex items-center space-x-2 mb-8 text-blue-600">
            <Droplet size={32} />
            <h1 className="text-xl font-bold">AquaGestor</h1>
          </div>
          <NavItem
            icon={<Home />}
            label="Panel"
            isActive={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon={<Wrench />}
            label="Mantenimientos"
            isActive={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
          />
          <NavItem
            icon={<Plus />}
            label="Nuevo"
            isActive={activeTab === 'form'}
            onClick={() => { setEditingTask(null); setActiveTab('form'); }}
          />
          <NavItem
            icon={<FileText />}
            label="Reportes"
            isActive={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />

          {/* Logout desktop */}
          <div className="hidden md:block mt-auto pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 mb-2 truncate">{user.email}</div>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center space-x-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors w-full"
            >
              <LogOut size={16} /><span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8 md:h-screen md:overflow-y-auto">

        {/* Cabecera */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-blue-600 md:hidden">
            <Droplet size={28} />
            <h1 className="text-xl font-bold">AquaGestor</h1>
          </div>
          <div className="hidden md:flex flex-1"></div>
          <div className="flex items-center space-x-3">

            {/* Estado de red */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Botón ver alertas mobile */}
            <button
              onClick={showAlerts}
              className="p-2 rounded-full transition-colors md:hidden text-red-500 bg-red-50 hover:bg-red-100"
              title="Ver alertas"
            >
              <Bell size={20} />
            </button>

            {/* Botón notificaciones sistema mobile */}
            <button
              onClick={requestNotifications}
              className={`p-2 rounded-full transition-colors md:hidden ${
                notificationPermission === 'granted'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-400 bg-slate-100'
              }`}
              title={notificationPermission === 'granted' ? 'Alertas activadas' : 'Activar alertas'}
            >
              {notificationPermission === 'granted' ? <BellOff size={20} /> : <BellOff size={20} />}
            </button>

            {/* Logout mobile */}
            <button
              onClick={() => signOut(auth)}
              className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors md:hidden"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Vistas */}
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
          />
        )}
        {activeTab === 'form' && (
          <TaskForm
            onSubmit={handleAddTask}
            initialData={editingTask}
            types={TASK_TYPES}
            urgencies={URGENCIES}
            statuses={STATUSES}
            onCancel={() => setActiveTab('list')}
            clients={clients}
          />
        )}
        {activeTab === 'reports' && (
          <Reports tasks={tasks} />
        )}
      </main>

      {/* Toasts */}
      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
}