import { useState } from 'react';
import { CheckCircle, X, Clock, User } from 'lucide-react';

export default function CompleteModal({ task, user, onConfirm, onCancel }) {
  const [observations, setObservations] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm({
      completionObservations: observations,
      completedAt: new Date().toISOString(),
      completedBy: user?.email || '—',
    });
    setIsLoading(false);
  };

  const now = new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header con marca */}
        <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Completar mantenimiento</h3>
                <p className="text-xs text-green-100">Confirma para marcar como completado</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Info de la tarea */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <p className="font-semibold text-slate-800">{task.clientName}</p>
          <p className="text-sm text-slate-500">{task.type}</p>
          {task.serviceOrder && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              OS: {task.serviceOrder}
            </span>
          )}
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">

          {/* Fecha y usuario */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-blue-500 font-semibold mb-1">
                <Clock size={12} /><span>Fecha y hora</span>
              </div>
              <p className="text-sm font-bold text-blue-800">{now}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-green-500 font-semibold mb-1">
                <User size={12} /><span>Completado por</span>
              </div>
              <p className="text-sm font-bold text-green-800 truncate">{user?.email || '—'}</p>
            </div>
          </div>

          {/* Observación de cierre */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Observación de cierre
              <span className="text-slate-400 font-normal ml-1 normal-case">(opcional)</span>
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              placeholder="Describe brevemente el trabajo realizado..."
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors resize-none"
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              autoFocus
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm shadow-md"
            style={{ background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #16a34a, #15803d)' }}
          >
            <CheckCircle size={18} />
            <span>{isLoading ? 'Guardando...' : 'Confirmar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}