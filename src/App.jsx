import React, { useState, useEffect, useMemo } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, appId } from './lib/firebase';
import Login from './components/Login.jsx';
import { 
  Home, Wrench, FileText, Plus, Calendar, AlertCircle, CheckCircle, 
  Clock, Search, Filter, Droplet, User, Phone, MapPin, Trash2, 
  Edit, Bell, BellOff, Cloud, CloudOff, LogOut
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // 1. Autenticación con email/password
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escuchar estado de red
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

  // 3. Cargar tareas desde Firestore
  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Notificaciones
  const requestNotifications = () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
    });
  };

  const taskTypes = ['Cambio de Filtro', 'Mantenimiento General', 'Instalación', 'Revisión por Fuga', 'Garantía'];
  const urgencies = ['Baja', 'Media', 'Alta'];
  const statuses = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

  // Acciones Firestore
  const addTask = async (task) => {
    if (!user) return;
    const taskId = task.id || crypto.randomUUID();
    const taskData = { ...task, id: taskId, createdAt: task.createdAt || new Date().toISOString() };
    setActiveTab('list');
    setEditingTask(null);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', taskId), taskData);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const deleteTask = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setActiveTab('form');
  };

  const markAsCompleted = async (id) => {
    if (!user) return;
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;
    const updatedTask = { ...taskToUpdate, status: 'Completado' };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', id), updatedTask);
    } catch (error) {
      console.error("Error al completar:", error);
    }
  };

  // Estados de carga y auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Droplet size={48} className="text-blue-500 animate-bounce mb-4" />
        <p className="text-slate-500 font-medium">Conectando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0 md:flex">
      
      {/* Navegación */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 md:relative md:w-64 md:border-t-0 md:border-r md:h-screen md:flex-shrink-0 z-10">
        <div className="flex justify-around p-3 md:flex-col md:p-6 md:space-y-4">
          <div className="hidden md:flex items-center space-x-2 mb-8 text-blue-600">
            <Droplet size={32} />
            <h1 className="text-xl font-bold">AquaGestor</h1>
          </div>
          <NavItem icon={<Home />} label="Panel" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wrench />} label="Mantenimientos" isActive={activeTab === 'list'} onClick={() => setActiveTab('list')} />
          <NavItem icon={<Plus />} label="Nuevo" isActive={activeTab === 'form'} onClick={() => { setEditingTask(null); setActiveTab('form'); }} />
          <NavItem icon={<FileText />} label="Reportes" isActive={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          
          {/* Logout en sidebar desktop */}
          <div className="hidden md:block mt-auto pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 mb-2 truncate">{user.email}</div>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center space-x-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors w-full"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
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
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
              {isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={requestNotifications}
              className={`p-2 rounded-full md:hidden ${notificationPermission === 'granted' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100'}`}
            >
              {notificationPermission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
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

        {activeTab === 'dashboard' && (
          <Dashboard
            tasks={tasks}
            onNavigate={setActiveTab}
            notificationPermission={notificationPermission}
            onRequestNotifications={requestNotifications}
          />
        )}
        {activeTab === 'list' && (
          <TaskList tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} onComplete={markAsCompleted} />
        )}
        {activeTab === 'form' && (
          <TaskForm
            onSubmit={addTask}
            initialData={editingTask}
            types={taskTypes}
            urgencies={urgencies}
            statuses={statuses}
            onCancel={() => setActiveTab('list')}
          />
        )}
        {activeTab === 'reports' && <Reports tasks={tasks} />}
      </main>
    </div>
  );
}

// --- Componentes ---

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 p-2 md:p-3 rounded-lg transition-colors w-full ${
        isActive ? 'text-blue-600 bg-blue-50 md:bg-blue-100' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
      }`}
    >
      <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</div>
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </button>
  );
}

function Dashboard({ tasks, onNavigate, notificationPermission, onRequestNotifications }) {
  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
  const urgentTasks = pendingTasks.filter(t => t.urgency === 'Alta');
  const dueTodayTasks = pendingTasks.filter(t => t.dueDate === today);
  const overdueTasks = pendingTasks.filter(t => t.dueDate < today);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Panel General</h2>
        <button
          onClick={onRequestNotifications}
          className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            notificationPermission === 'granted'
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
          <span>{notificationPermission === 'granted' ? 'Alertas Activadas' : 'Activar Alertas'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendientes" count={pendingTasks.length} icon={<Clock />} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard title="Urgentes" count={urgentTasks.length} icon={<AlertCircle />} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Para Hoy" count={dueTodayTasks.length} icon={<Calendar />} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Atrasados" count={overdueTasks.length} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Urgentes / Atrasados</h3>
          <button onClick={() => onNavigate('list')} className="text-sm text-blue-600 font-medium hover:underline">Ver todos</button>
        </div>
        <div className="space-y-3">
          {[...overdueTasks, ...urgentTasks].slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${task.dueDate < today ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {task.dueDate < today ? <AlertCircle size={18} /> : <Clock size={18} />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{task.clientName}</p>
                  <p className="text-xs text-slate-500">{task.type} • {task.dueDate}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">{task.urgency}</span>
            </div>
          ))}
          {[...overdueTasks, ...urgentTasks].length === 0 && (
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

function StatCard({ title, count, icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <span className="text-2xl font-bold text-slate-800">{count}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    </div>
  );
}

function TaskList({ tasks, onEdit, onDelete, onComplete }) {
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

function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate < today && task.status !== 'Completado' && task.status !== 'Cancelado';
  const statusColors = {
    'Pendiente': 'bg-yellow-100 text-yellow-700',
    'En Proceso': 'bg-blue-100 text-blue-700',
    'Completado': 'bg-green-100 text-green-700',
    'Cancelado': 'bg-slate-100 text-slate-500',
  };

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
            <Phone size={12} /> <span>{task.clientPhone}</span>
          </p>
        )}
        {task.clientAddress && (
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <MapPin size={12} /> <span>{task.clientAddress}</span>
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
          <button
            onClick={onComplete}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm rounded-lg transition-colors"
          >
            <CheckCircle size={16} />
            <span>Completar</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TaskForm({ onSubmit, initialData, types, urgencies, statuses, onCancel }) {
  const [formData, setFormData] = useState(initialData || {
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    equipment: '',
    type: types[0],
    urgency: 'Media',
    status: 'Pendiente',
    dueDate: new Date().toISOString().split('T')[0],
    observations: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {initialData ? 'Editar Registro' : 'Nuevo Recordatorio'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1"><User size={14} className="inline mr-1" />Cliente</label>
            <input name="clientName" value={formData.clientName} onChange={handleChange} required placeholder="Nombre del cliente"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1"><Phone size={14} className="inline mr-1" />Teléfono</label>
            <input name="clientPhone" value={formData.clientPhone} onChange={handleChange} placeholder="Número de contacto"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1"><MapPin size={14} className="inline mr-1" />Dirección</label>
          <input name="clientAddress" value={formData.clientAddress} onChange={handleChange} placeholder="Dirección del cliente"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Equipo</label>
          <input name="equipment" value={formData.equipment} onChange={handleChange} placeholder="Modelo o descripción del equipo"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
            <select name="type" value={formData.type} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Urgencia</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {urgencies.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Estado</label>
            <select name="status" value={formData.status} onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1"><Calendar size={14} className="inline mr-1" />Fecha límite</label>
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Observaciones</label>
          <textarea name="observations" value={formData.observations} onChange={handleChange} rows={3} placeholder="Notas adicionales..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="flex space-x-3 pt-2">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {initialData ? 'Actualizar Registro' : 'Guardar Recordatorio'}
          </button>
          {initialData && (
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Reports({ tasks }) {
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
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <select value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Urgencia</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{task.clientName}</td>
                  <td className="px-4 py-3 text-slate-500">{task.type}</td>
                  <td className="px-4 py-3 text-slate-500">{task.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                      task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'}`}>
                      {task.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'Completado' ? 'bg-green-100 text-green-700' :
                      task.status === 'Cancelado' ? 'bg-slate-100 text-slate-500' :
                      task.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'}`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No hay registros con estos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}