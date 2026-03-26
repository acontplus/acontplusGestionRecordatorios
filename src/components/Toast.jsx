import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Clock, X } from 'lucide-react';

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 8000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const styles = {
    overdue: {
      bg: 'bg-red-50 border-red-300',
      icon: <AlertCircle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />,
      title: 'text-red-800',
      body: 'text-red-700',
      bar: 'bg-red-400',
    },
    today: {
      bg: 'bg-blue-50 border-blue-300',
      icon: <Calendar size={22} className="text-blue-500 flex-shrink-0 mt-0.5" />,
      title: 'text-blue-800',
      body: 'text-blue-700',
      bar: 'bg-blue-400',
    },
    urgent: {
      bg: 'bg-yellow-50 border-yellow-300',
      icon: <Clock size={22} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
      title: 'text-yellow-800',
      body: 'text-yellow-700',
      bar: 'bg-yellow-400',
    },
  };

  const s = styles[toast.type] || styles.urgent;

  return (
    <div className={`relative flex items-start space-x-3 p-4 rounded-xl border-2 shadow-xl overflow-hidden ${s.bg} animate-slide-in`}>
      {/* Barra lateral de color */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.bar}`} />
      <div className="ml-2">
        {s.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold mb-1 ${s.title}`}>{toast.title}</p>
        <p className={`text-sm leading-relaxed ${s.body}`}>{toast.body}</p>
        {toast.observations && (
          <p className="text-xs mt-2 text-slate-600 bg-white bg-opacity-60 rounded-lg p-2 leading-relaxed">
            📝 {toast.observations}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-700 flex-shrink-0 p-1 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default function Toast({ toasts, onClose }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 w-96 max-w-[calc(100vw-2rem)]">
      {/* Encabezado si hay múltiples */}
      {toasts.length > 1 && (
        <div className="flex justify-between items-center bg-slate-800 text-white px-4 py-2 rounded-xl shadow-xl">
          <span className="text-sm font-semibold">🔔 {toasts.length} alertas pendientes</span>
          <button
            onClick={() => toasts.forEach(t => onClose(t.id))}
            className="text-xs text-slate-300 hover:text-white underline"
          >
            Cerrar todas
          </button>
        </div>
      )}
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}