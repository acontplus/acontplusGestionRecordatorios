import { useState, useEffect, useRef, useCallback } from 'react';

// Detecta si el navegador es móvil
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Función para mostrar notificación compatible con móvil y desktop
async function showNotification(title, body, icon) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if (isMobile && 'serviceWorker' in navigator) {
      // Android requiere Service Worker para mostrar notificaciones
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon });
    } else {
      // Desktop — usa el constructor directo
      new Notification(title, { body, icon });
    }
  } catch (err) {
    // Si falla la notificación del sistema, no romper la app
    console.warn('Notificación del sistema no disponible:', err.message);
  }
}

export function useNotifications(tasks) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [toasts, setToasts] = useState([]);
  const notifiedIds = useRef(new Set());
  const hasInitialized = useRef(false);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    notifiedIds.current.clear();
    hasInitialized.current = false;
    return result;
  };

  const buildToast = (task, index) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate < today;
    const isDueToday = task.dueDate === today;

    let type = 'urgent';
    let title = '';
    let body = '';

    if (isOverdue) {
      type = 'overdue';
      title = '⚠️ Tarea atrasada';
      body = `${task.clientName} — ${task.type} venció el ${task.dueDate}`;
    } else if (isDueToday) {
      type = 'today';
      title = '📅 Tarea para hoy';
      body = `${task.clientName} — ${task.type}`;
    } else {
      type = 'urgent';
      title = '🔴 Tarea urgente';
      body = `${task.clientName} — ${task.type} (${task.dueDate})`;
    }

    return {
      id: `${task.id}-${Date.now()}-${index}`,
      type,
      title,
      body,
      observations: task.observations || '',
    };
  };

  const showAlerts = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');
    const alertTasks = pending.filter(t =>
      t.dueDate < today || t.dueDate === today || t.urgency === 'Alta'
    );

    if (alertTasks.length === 0) {
      setToasts([{
        id: `no-alerts-${Date.now()}`,
        type: 'today',
        title: '✅ Todo al día',
        body: 'No hay tareas urgentes ni atrasadas.',
        observations: '',
      }]);
      return;
    }

    const newToasts = alertTasks.map((task, index) => buildToast(task, index));
    setToasts(newToasts);
  }, [tasks]);

  useEffect(() => {
    if (tasks.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const newToasts = [];

      pending.forEach((task, index) => {
        const isOverdue = task.dueDate < today;
        const isDueToday = task.dueDate === today;
        const isUrgent = task.urgency === 'Alta';

        if (!isOverdue && !isDueToday && !isUrgent) {
          notifiedIds.current.add(task.id);
          return;
        }

        if (notifiedIds.current.has(task.id)) return;
        notifiedIds.current.add(task.id);

        const toast = buildToast(task, index);
        newToasts.push(toast);

        // Notificación del sistema con delay escalonado
        setTimeout(() => {
          showNotification(toast.title, toast.body, '/favicon.svg');
        }, index * 800);
      });

      if (newToasts.length > 0) setToasts(newToasts);
      return;
    }

    // Tareas nuevas después de la carga inicial
    pending.forEach((task, index) => {
      if (notifiedIds.current.has(task.id)) return;
      notifiedIds.current.add(task.id);

      const isOverdue = task.dueDate < today;
      const isDueToday = task.dueDate === today;
      const isUrgent = task.urgency === 'Alta';

      if (!isOverdue && !isDueToday && !isUrgent) return;

      const toast = buildToast(task, index);
      setToasts(prev => [...prev, toast]);
      showNotification(toast.title, toast.body, '/favicon.svg');
    });
  }, [tasks, permission]);

  return { permission, requestPermission, toasts, removeToast, showAlerts };
}