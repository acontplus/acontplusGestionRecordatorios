import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Clock, X, ChevronDown, ChevronUp, Bell, Printer, MessageCircle } from 'lucide-react';
import { printTaskPDF, shareViaWhatsApp } from './TaskPDF.jsx';

function ToastItem({ toast, onClose }) {
  const styles = {
    overdue: {
      bg: 'bg-red-50 border-red-300',
      icon: <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />,
      title: 'text-red-800',
      body: 'text-red-700',
      bar: 'bg-red-400',
      actionBg: 'hover:bg-red-100',
    },
    today: {
      bg: 'bg-blue-50 border-blue-300',
      icon: <Calendar size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />,
      title: 'text-blue-800',
      body: 'text-blue-700',
      bar: 'bg-blue-400',
      actionBg: 'hover:bg-blue-100',
    },
    urgent: {
      bg: 'bg-yellow-50 border-yellow-300',
      icon: <Clock size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
      title: 'text-yellow-800',
      body: 'text-yellow-700',
      bar: 'bg-yellow-400',
      actionBg: 'hover:bg-yellow-100',
    },
  };

  const s = styles[toast.type] || styles.urgent;

  return (
    <div className={`relative flex flex-col p-3 rounded-xl border-2 shadow-lg ${s.bg} animate-slide-in`}>
      {/* Barra lateral */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${s.bar}`} />

      {/* Contenido principal */}
      <div className="flex items-start space-x-3 ml-2">
        {s.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold mb-0.5 ${s.title}`}>{toast.title}</p>
          <p className={`text-sm leading-relaxed ${s.body}`}>{toast.body}</p>
          {toast.observations && (
            <p className="text-xs mt-1.5 text-slate-600 bg-white bg-opacity-70 rounded-lg p-2 leading-relaxed">
              📝 {toast.observations}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-slate-400 hover:text-slate-700 flex-shrink-0 p-1 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Acciones rápidas — solo si hay tarea */}
      {toast.task && (
        <div className="flex items-center space-x-2 mt-2 ml-2 pt-2 border-t border-white border-opacity-50">
          <button
            onClick={() => printTaskPDF(toast.task)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white bg-opacity-70 ${s.actionBg} transition-colors`}
            title="Imprimir / Guardar PDF"
          >
            <Printer size={13} />
            <span>PDF</span>
          </button>
          <button
            onClick={() => shareViaWhatsApp(toast.task)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
            title="Enviar por WhatsApp"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Toast({ toasts, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (toasts.length > 0) setIsMinimized(false);
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-slate-200">

      {/* Header fijo */}
      <div className="flex justify-between items-center px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
        <div className="flex items-center space-x-2">
          <Bell size={16} className="text-white" />
          <span className="text-sm font-bold text-white">
            {toasts.length} {toasts.length === 1 ? 'alerta pendiente' : 'alertas pendientes'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toasts.forEach(t => onClose(t.id))}
            className="text-xs text-white text-opacity-80 hover:text-white underline transition-colors"
          >
            Cerrar todas
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white text-opacity-80 hover:text-white transition-colors p-0.5"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Lista con scroll */}
      {!isMinimized && (
        <>
          <div
            className="flex flex-col space-y-2 p-3 bg-white overflow-y-auto"
            style={{ maxHeight: 'min(60vh, 480px)' }}
          >
            {toasts.map(toast => (
              <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
          </div>

          {toasts.length > 3 && (
            <div className="bg-slate-100 px-4 py-2 flex items-center justify-between flex-shrink-0 border-t border-slate-200">
              <span className="text-xs text-slate-500">Desliza para ver todas las alertas</span>
              <ChevronDown size={14} className="text-slate-400 animate-bounce" />
            </div>
          )}
        </>
      )}
    </div>
  );
}