import { useState, useEffect, useRef, useCallback } from 'react';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

async function showSystemNotification(title, body, icon) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    if (isMobile && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon });
    } else {
      new Notification(title, { body, icon });
    }
  } catch (err) {
    console.warn('Notificación del sistema no disponible:', err.message);
  }
}

// ✅ Visita programada más cercana de una tarea
function getNextVisit(task) {
  if (!task.visits?.length) return null;
  return task.visits
    .filter(v => v.status === 'Programada')
    .sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
      return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
    })[0] || null;
}

// ✅ Toast basado en la visita (no en task.dueDate)
function buildToast(task, visit, index) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = visit.scheduledDate < today;
  const isToday   = visit.scheduledDate === today;

  let type, title, body;

  if (isOverdue) {
    type  = 'overdue';
    title = '⚠️ Visita atrasada';
    body  = `${task.clientName} — ${visit.type || 'Visita'} programada el ${visit.scheduledDate}`;
  } else if (isToday) {
    type  = 'today';
    title = '📅 Visita para hoy';
    body  = `${task.clientName} — ${visit.type || 'Visita'}${visit.scheduledTime ? ' a las ' + visit.scheduledTime : ''}`;
  } else {
    type  = 'urgent';
    title = '🔴 Visita urgente';
    body  = `${task.clientName} — ${visit.type || 'Visita'} el ${visit.scheduledDate}`;
  }

  return {
    id: `${task.id}-${visit.id}-${Date.now()}-${index}`,
    type,
    title,
    body,
    observations: visit.observations || task.observations || '',
    task,
  };
}

export function useNotifications(tasks) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [toasts, setToasts] = useState([]);
  const notifiedIds    = useRef(new Set());
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

  // ✅ showAlerts: recorre visitas dentro de cada tarea
  const showAlerts = useCallback(() => {
    const today   = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');

    const alertItems = [];
    pending.forEach((task, ti) => {
      const visit = getNextVisit(task);
      if (!visit) return;
      const isOverdue = visit.scheduledDate < today;
      const isToday   = visit.scheduledDate === today;
      const isUrgent  = visit.urgency === 'Alta';
      if (isOverdue || isToday || isUrgent) {
        alertItems.push(buildToast(task, visit, ti));
      }
    });

    if (alertItems.length === 0) {
      setToasts([{
        id: `no-alerts-${Date.now()}`,
        type: 'today',
        title: '✅ Todo al día',
        body: 'No hay visitas urgentes ni atrasadas.',
        observations: '',
        task: null,
      }]);
      return;
    }
    setToasts(alertItems);
  }, [tasks]);

  // ✅ Carga inicial y seguimiento basado en visitas
  useEffect(() => {
    if (tasks.length === 0) return;

    const today   = new Date().toISOString().split('T')[0];
    const pending = tasks.filter(t => t.status !== 'Completado' && t.status !== 'Cancelado');

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const newToasts = [];

      pending.forEach((task, index) => {
        const visit = getNextVisit(task);
        if (!visit) { notifiedIds.current.add(task.id); return; }

        const isOverdue = visit.scheduledDate < today;
        const isToday   = visit.scheduledDate === today;
        const isUrgent  = visit.urgency === 'Alta';

        if (!isOverdue && !isToday && !isUrgent) {
          notifiedIds.current.add(task.id);
          return;
        }
        if (notifiedIds.current.has(task.id)) return;
        notifiedIds.current.add(task.id);

        const toast = buildToast(task, visit, index);
        newToasts.push(toast);
        setTimeout(() => showSystemNotification(toast.title, toast.body, '/logo.png'), index * 800);
      });

      if (newToasts.length > 0) setToasts(newToasts);
      return;
    }

    // Tareas nuevas tras la carga inicial
    pending.forEach((task, index) => {
      if (notifiedIds.current.has(task.id)) return;

      const visit = getNextVisit(task);
      if (!visit) { notifiedIds.current.add(task.id); return; }

      const isOverdue = visit.scheduledDate < today;
      const isToday   = visit.scheduledDate === today;
      const isUrgent  = visit.urgency === 'Alta';

      if (!isOverdue && !isToday && !isUrgent) return;

      notifiedIds.current.add(task.id);
      const toast = buildToast(task, visit, index);
      setToasts(prev => [...prev, toast]);
      showSystemNotification(toast.title, toast.body, '/logo.png');
    });
  }, [tasks, permission]);

  return { permission, requestPermission, toasts, removeToast, showAlerts };
}