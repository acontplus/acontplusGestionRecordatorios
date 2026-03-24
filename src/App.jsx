import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence } from 'firebase/firestore';
import { 
  Home, 
  Wrench, 
  FileText, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  Droplet,
  User,
  Phone,
  MapPin,
  Trash2,
  Edit,
  Bell,
  BellOff,
  Cloud,
  CloudOff
} from 'lucide-react';

// --- Configuración de Base de Datos (Firebase) ---

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLoizpo8euStS8eyDxw_34COvyN1g89A0",
  authDomain: "gestorrecordatorios.firebaseapp.com",
  projectId: "gestorrecordatorios",
  storageBucket: "gestorrecordatorios.firebasestorage.app",
  messagingSenderId: "1019687901672",
  appId: "1:1019687901672:web:d20fc92974116f110fec5d",
  measurementId: "G-ZHZP8489YG"
};

// ¡ESTAS SON LAS LÍNEAS QUE FALTAN! Deben ir justo debajo de tu configuración:
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.appId;

// Intentar habilitar la persistencia offline de la base de datos
try {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Nota: La persistencia offline podría estar limitada en esta pestaña.", err.code);
  });
} catch (e) {
  console.log("Configuración de persistencia omitida en este entorno.");
}

// --- Componente Principal ---
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

  // 1. Efecto de Autenticación Segura
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Efecto de Sincronización de Datos (Online/Offline)
  useEffect(() => {
    if (!user) return;

    // AHORA: Ruta compartida para todos los dispositivos de la empresa
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks');
    
    // onSnapshot escucha los cambios en tiempo real y lee la caché offline
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() });
      });
      setTasks(fetchedTasks);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al obtener datos:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Efecto para detectar estado de red (Internet)
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

  // Motor de Notificaciones
  useEffect(() => {
    if (notificationPermission === 'granted' && !isLoading) {
      const today = new Date().toISOString().split('T')[0];
      const alertTasks = tasks.filter(t => 
        (t.dueDate <= today || t.urgency === 'Alta') && 
        t.status !== 'Completado' && 
        t.status !== 'Cancelado'
      );

      if (alertTasks.length > 0) {
        if (!sessionStorage.getItem('notified_today')) {
          new Notification('AquaGestor - Recordatorios', {
            body: `Tienes ${alertTasks.length} mantenimientos urgentes o atrasados para revisar.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3105/3105807.png'
          });
          sessionStorage.setItem('notified_today', 'true');
        }
      }
    }
  }, [tasks, notificationPermission, isLoading]);

  const requestNotifications = () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
    });
  };

  // Opciones de configuración
  const taskTypes = ['Cambio de Filtro', 'Mantenimiento General', 'Instalación', 'Revisión por Fuga', 'Garantía'];
  const urgencies = ['Baja', 'Media', 'Alta'];
  const statuses = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

  // Acciones de Base de Datos
  const addTask = async (task) => {
    if (!user) return;
    const taskId = task.id || Date.now().toString();
    const taskData = { ...task, id: taskId, createdAt: task.createdAt || new Date().toISOString() };
    
    // Cambiamos de pestaña inmediatamente para una sensación de fluidez
    setActiveTab('list');
    setEditingTask(null);

    try {
      // Guardar en Firestore en la ruta pública compartida
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', taskId), taskData);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el registro.");
    }
  };

  const deleteTask = async (id) => {
    if(!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    if (!user) return;
    try {
      // Eliminar de la ruta pública compartida
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
      // Actualizar en la ruta pública compartida
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', id), updatedTask);
    } catch (error) {
      console.error("Error al completar:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Droplet size={48} className="text-blue-500 animate-bounce mb-4" />
        <p className="text-slate-500 font-medium">Conectando a la base de datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 md:pb-0 md:flex">
      {/* Navegación Lateral (Desktop) / Inferior (Mobile) */}
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
        </div>
      </nav>

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 md:h-screen md:overflow-y-auto">
        {/* Cabecera Móvil y Estado de Red */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-blue-600 md:hidden">
            <Droplet size={28} />
            <h1 className="text-xl font-bold">AquaGestor</h1>
          </div>
          
          {/* Indicador de estado de red visible en todos los dispositivos */}
          <div className="hidden md:flex flex-1"></div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`} title={isOnline ? 'Conectado a la nube' : 'Modo Offline (Guardando local)'}>
              {isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <button 
              onClick={requestNotifications} 
              className={`p-2 rounded-full md:hidden ${notificationPermission === 'granted' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100'}`}
            >
              {notificationPermission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && <Dashboard tasks={tasks} onNavigate={setActiveTab} notificationPermission={notificationPermission} onRequestNotifications={requestNotifications} />}
        {activeTab === 'list' && <TaskList tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} onComplete={markAsCompleted} />}
        {activeTab === 'form' && <TaskForm onSubmit={addTask} initialData={editingTask} types={taskTypes} urgencies={urgencies} statuses={statuses} onCancel={() => setActiveTab('list')} />}
        {activeTab === 'reports' && <Reports tasks={tasks} />}
      </main>
    </div>
  );
}

// --- Componentes Secundarios ---

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
        
        {/* Botón de Notificaciones para Desktop */}
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
      
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pendientes" count={pendingTasks.length} icon={<Clock />} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard title="Urgentes" count={urgentTasks.length} icon={<AlertCircle />} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Para Hoy" count={dueTodayTasks.length} icon={<Calendar />} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Atrasados" count={overdueTasks.length} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" />
      </div>

      {/* Próximos Mantenimientos */}
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
              <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                {task.urgency}
              </span>
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
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
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
    .filter(t => t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Mantenimientos Pendientes</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente o servicio..." 
            className="pl-10 pr-4 py-2 w-full md:w-64 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pendingTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={() => onEdit(task)} 
            onDelete={() => onDelete(task.id)}
            onComplete={() => onComplete(task.id)}
          />
        ))}
        {pendingTasks.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
            <h3 className="text-lg font-medium text-slate-800">¡Todo al día!</h3>
            <p className="text-slate-500">No hay mantenimientos pendientes por ahora.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onComplete }) {
  const urgencyColors = {
    'Baja': 'bg-green-100 text-green-700',
    'Media': 'bg-yellow-100 text-yellow-700',
    'Alta': 'bg-red-100 text-red-700'
  };

  const isOverdue = new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg">
          {task.type}
        </span>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${urgencyColors[task.urgency]}`}>
          Urgencia {task.urgency}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
        <User size={16} className="text-slate-400" />
        {task.clientName}
      </h3>
      
      <div className="space-y-1.5 mb-4 flex-1">
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <Phone size={14} className="text-slate-400" /> {task.clientPhone}
        </p>
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <MapPin size={14} className="text-slate-400" /> {task.clientAddress}
        </p>
        <p className={`text-sm font-medium flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
          <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-slate-400'} /> 
          Para: {task.dueDate} {isOverdue && '(Atrasado)'}
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
        <button 
          onClick={onComplete}
          className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm rounded-lg transition-colors"
        >
          <CheckCircle size={16} />
          <span>Completar</span>
        </button>
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
    dueDate: new Date().toISOString().split('T')[0], // Hoy por defecto
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
        {initialData ? 'Editar Registro' : 'Nuevo Mantenimiento / Recordatorio'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Datos del Cliente</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
              <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input type="text" name="clientAddress" value={formData.clientAddress} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Sección Servicio */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Detalles del Servicio</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Equipo / Modelo de Filtro</label>
              <input type="text" name="equipment" placeholder="Ej. Osmosis Inversa 5 Etapas" value={formData.equipment} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Servicio *</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Programada *</label>
              <input required type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Urgencia</label>
              <select name="urgency" value={formData.urgency} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {initialData && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado de Ejecución</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea name="observations" rows="3" placeholder="Repuestos necesarios, notas sobre el cliente..." value={formData.observations} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
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
    }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)); // Más recientes primero
  }, [tasks, filterStatus, filterUrgency]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Reporte de Mantenimientos</h2>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center text-slate-500 font-medium">
          <Filter size={18} className="mr-2" /> Filtros:
        </div>
        <select 
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        
        <select 
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
        >
          <option value="Todos">Todas las urgencias</option>
          <option value="Alta">Urgencia Alta</option>
          <option value="Media">Urgencia Media</option>
          <option value="Baja">Urgencia Baja</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Servicio</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4 font-medium">Urgencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{task.clientName}</p>
                    <p className="text-xs text-slate-500">{task.clientPhone}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{task.type}</td>
                  <td className="p-4 text-sm text-slate-700">{task.dueDate}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      task.status === 'Completado' ? 'bg-green-100 text-green-700' :
                      task.status === 'Cancelado' ? 'bg-slate-100 text-slate-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                        task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {task.urgency}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No se encontraron registros con los filtros actuales.
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