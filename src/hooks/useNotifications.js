import { useState, useEffect, useRef, useCallback } from 'react';

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

  // Función para mostrar alertas manualmente desde un botón
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
        body: 'No hay tareas urgentes ni atrasadas en este momento.',
        observations: '',
      }]);
      return;
    }

    const newToasts = alertTasks.map((task, index) => {
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
        id: `manual-${task.id}-${Date.now()}-${index}`,
        type,
        title,
        body,
        observations: task.observations || '',
      };
    });

    setToasts(newToasts);
  }, [tasks]);

  // Carga inicial automática
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

        if (title) {
          newToasts.push({
            id: `${task.id}-${Date.now()}-${index}`,
            type,
            title,
            body,
            observations: task.observations || '',
          });

          if (permission === 'granted') {
            setTimeout(() => {
              new Notification(title, { body, icon: '/favicon.svg' });
            }, index * 800);
          }
        }
      });

      if (newToasts.length > 0) setToasts(newToasts);
      return;
    }

    // Tareas nuevas después de la carga inicial
    pending.forEach(task => {
      if (notifiedIds.current.has(task.id)) return;
      notifiedIds.current.add(task.id);

      const isOverdue = task.dueDate < today;
      const isDueToday = task.dueDate === today;
      const isUrgent = task.urgency === 'Alta';

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
      } else if (isUrgent) {
        type = 'urgent';
        title = '🔴 Tarea urgente';
        body = `${task.clientName} — ${task.type} (${task.dueDate})`;
      }

      if (title) {
        setToasts(prev => [...prev, {
          id: `${task.id}-${Date.now()}`,
          type,
          title,
          body,
          observations: task.observations || '',
        }]);
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      }
    });
  }, [tasks, permission]);

  return { permission, requestPermission, toasts, removeToast, showAlerts };
}