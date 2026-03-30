import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, User,
  CalendarDays, Phone, MapPin, Wrench, AlertCircle,
  FileText, Hash, CheckCircle, X
} from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Construye los eventos del calendario ──────────────────────────────────
function getCalendarEvents(tasks) {
  const events = [];
  tasks.forEach(task => {
    // Visitas de la tarea
    if (task.visits?.length) {
      task.visits.forEach(visit => {
        if (visit.scheduledDate) {
          events.push({
            id:          `visit-${visit.id}`,
            date:        visit.scheduledDate,
            time:        visit.scheduledTime || '',
            title:       task.clientName,
            subtitle:    visit.type || visit.technician || '—',
            type:        'visit',
            visitStatus: visit.status,
            urgency:     visit.urgency || '',
            task,
            visit,
          });
        }
      });
    }
  });
  return events;
}

// ── Badge de urgencia ─────────────────────────────────────────────────────
function UrgencyBadge({ urgency, small }) {
  if (!urgency) return null;
  const cls = {
    'Alta':  'bg-red-100 text-red-700 border-red-200',
    'Media': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Baja':  'bg-green-100 text-green-700 border-green-200',
  }[urgency] || 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-block border rounded-full font-bold ${small ? 'text-[9px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} ${cls}`}>
      {urgency}
    </span>
  );
}

// ── Badge de estado de visita ─────────────────────────────────────────────
function VisitStatusBadge({ status, small }) {
  const cls = {
    'Programada': 'bg-blue-100 text-blue-700 border-blue-200',
    'Realizada':  'bg-green-100 text-green-700 border-green-200',
    'Cancelada':  'bg-amber-100 text-amber-700 border-amber-200',
    'Anulada':    'bg-red-100 text-red-600 border-red-200',
  }[status] || 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-block border rounded-full font-bold ${small ? 'text-[9px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} ${cls}`}>
      {status || '—'}
    </span>
  );
}

// ── EventBadge (vista mes) ────────────────────────────────────────────────
function EventBadge({ event, onClick }) {
  const visitBorderColor = {
    'Programada': '#D61672',
    'Realizada':  '#16a34a',
    'Cancelada':  '#f59e0b',
    'Anulada':    '#dc2626',
  }[event.visitStatus] || '#D61672';

  return (
    <button
      onClick={() => onClick(event)}
      className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate border-l-2 bg-white hover:bg-slate-50 transition-colors shadow-sm"
      style={{ borderLeftColor: visitBorderColor }}
      title={`${event.title}${event.time ? ' · ' + event.time : ''}${event.subtitle ? ' — ' + event.subtitle : ''}`}
    >
      {event.time && <span className="font-bold mr-1" style={{ color: visitBorderColor }}>{event.time}</span>}
      <span className="text-slate-700 font-medium">{event.title}</span>
    </button>
  );
}

// ── EventCard (vista semana — más grande y detallada) ─────────────────────
function EventCard({ event, onClick }) {
  const borderColor = {
    'Programada': '#D61672',
    'Realizada':  '#16a34a',
    'Cancelada':  '#f59e0b',
    'Anulada':    '#dc2626',
  }[event.visitStatus] || '#D61672';

  const bgColor = {
    'Programada': '#fdf2f8',
    'Realizada':  '#f0fdf4',
    'Cancelada':  '#fffbeb',
    'Anulada':    '#fef2f2',
  }[event.visitStatus] || '#fdf2f8';

  return (
    <button
      onClick={() => onClick(event)}
      className="w-full text-left rounded-lg p-2 border-l-[3px] shadow-sm hover:shadow-md transition-all hover:scale-[1.01] space-y-0.5"
      style={{ borderLeftColor: borderColor, background: bgColor }}>

      {/* Cliente + hora */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-bold text-slate-800 leading-tight truncate flex-1">
          {event.title}
        </p>
        {event.time && (
          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: borderColor }}>
            {event.time}
          </span>
        )}
      </div>

      {/* Tipo de visita */}
      {event.visit?.type && (
        <p className="text-[10px] text-slate-500 leading-tight truncate flex items-center gap-0.5">
          <Wrench size={9} className="flex-shrink-0" />
          {event.visit.type}
        </p>
      )}

      {/* Técnico */}
      {event.visit?.technician && (
        <p className="text-[10px] text-slate-500 leading-tight truncate flex items-center gap-0.5">
          <User size={9} className="flex-shrink-0" />
          {event.visit.technician}
        </p>
      )}

      {/* Badges: urgencia + estado */}
      <div className="flex items-center gap-1 flex-wrap pt-0.5">
        {event.urgency && (
          <UrgencyBadge urgency={event.urgency} small />
        )}
        <VisitStatusBadge status={event.visitStatus} small />
      </div>
    </button>
  );
}

// ── Modal de detalle completo de la visita ────────────────────────────────
function EventDetailModal({ event, onClose }) {
  if (!event) return null;

  const { task, visit } = event;

  const statusColor = {
    'Pendiente':  '#d97706',
    'En Proceso': '#2563eb',
    'Completado': '#16a34a',
    'Cancelado':  '#6b7280',
  }[task?.status] || '#6b7280';

  const visitBorderColor = {
    'Programada': '#D61672',
    'Realizada':  '#16a34a',
    'Cancelada':  '#f59e0b',
    'Anulada':    '#dc2626',
  }[visit?.status] || '#D61672';

  const Row = ({ icon, label, value, mono }) => (
    value ? (
      <div className="flex items-start space-x-2.5 py-2 border-b border-slate-50 last:border-0">
        <div className="flex-shrink-0 mt-0.5 text-slate-400">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
          <p className={`text-sm text-slate-800 leading-snug ${mono ? 'font-mono font-bold text-purple-700' : 'font-medium'}`}>
            {value}
          </p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* ── Header: cliente + estado visita ── */}
        <div className="text-white" style={{ background: `linear-gradient(135deg, ${visitBorderColor}, #FFA901)` }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                {/* Tipo de evento */}
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                  style={{ opacity: 0.75 }}>
                  📅 Visita programada
                </p>
                {/* Nombre cliente */}
                <h3 className="text-lg font-bold text-white leading-tight truncate">
                  {task?.clientName || '—'}
                </h3>
                {/* Técnico */}
                {visit?.technician && (
                  <p className="text-sm text-white mt-0.5" style={{ opacity: 0.85 }}>
                    {visit.technician}
                  </p>
                )}
              </div>
              <button onClick={onClose}
                className="ml-2 flex-shrink-0 p-1.5 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={20} />
              </button>
            </div>

            {/* Chips: OS + estado tarea */}
            <div className="flex flex-wrap gap-1.5">
              {task?.serviceOrder && (
                <div className="flex items-center space-x-1 rounded-lg px-2.5 py-1"
                  style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <Hash size={11} className="text-white" />
                  <span className="text-xs font-bold text-white font-mono">OS: {task.serviceOrder}</span>
                </div>
              )}
              {task?.status && (
                <div className="flex items-center rounded-lg px-2.5 py-1"
                  style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="text-xs font-semibold text-white">{task.status}</span>
                </div>
              )}
              <div className="flex items-center rounded-lg px-2.5 py-1"
                style={{ background: 'rgba(255,255,255,0.22)' }}>
                <span className="text-xs font-semibold text-white">{visit?.status || '—'}</span>
              </div>
              {visit?.urgency && (
                <div className="flex items-center rounded-lg px-2.5 py-1"
                  style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="text-xs font-semibold text-white">{visit.urgency}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Cuerpo: información completa ── */}
        <div className="px-5 py-4 space-y-0 overflow-y-auto" style={{ maxHeight: '55vh' }}>

          {/* Fecha y hora */}
          <Row
            icon={<Calendar size={14} />}
            label="Fecha programada"
            value={`${formatDateOnly(visit?.scheduledDate)}${visit?.scheduledTime ? ' · ' + visit.scheduledTime : ''}`}
          />

          {/* Tipo de visita */}
          <Row
            icon={<Wrench size={14} />}
            label="Tipo de visita"
            value={visit?.type}
          />

          {/* Técnico */}
          <Row
            icon={<User size={14} />}
            label="Técnico asignado"
            value={visit?.technician}
          />

          {/* Datos del cliente */}
          {task?.clientPhone && (
            <Row icon={<Phone size={14} />} label="Teléfono" value={task.clientPhone} />
          )}
          {task?.clientAddress && (
            <Row icon={<MapPin size={14} />} label="Dirección" value={task.clientAddress} />
          )}
          {task?.identification && (
            <Row icon={<FileText size={14} />} label="Cédula / RUC" value={task.identification} mono />
          )}

          {/* Observaciones de la visita */}
          {visit?.observations && (
            <div className="py-2 border-b border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">📝 Observaciones</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-2.5">
                {visit.observations}
              </p>
            </div>
          )}

          {/* Observaciones de la tarea */}
          {task?.observations && (
            <div className="py-2 border-b border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">📋 Obs. de la tarea</p>
              <p className="text-sm text-slate-500 italic leading-relaxed bg-amber-50 rounded-lg p-2.5">
                {task.observations}
              </p>
            </div>
          )}

          {/* Datos de cierre (si realizada) */}
          {visit?.status === 'Realizada' && visit?.completedAt && (
            <div className="mt-2 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1.5">✅ Datos de cierre</p>
              <div className="space-y-1">
                <p className="text-xs text-green-700">
                  <span className="font-semibold">Completado:</span> {formatDate(visit.completedAt)}
                </p>
                {visit.completedBy && (
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">Por:</span> {visit.completedBy}
                  </p>
                )}
                {visit.closingObservations && (
                  <p className="text-xs text-green-700 bg-green-100 rounded-lg p-2 mt-1">
                    {visit.closingObservations}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-5 pt-3">
          <button onClick={onClose}
            className="w-full py-2.5 text-white font-bold rounded-xl text-sm transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${visitBorderColor}, #FFA901)` }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vista mensual ─────────────────────────────────────────────────────────
function MonthView({ year, month, events, onEventClick }) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Cabecera días */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAYS.map(day => (
          <div key={day} className="px-2 py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return (
            <div key={`e-${idx}`} className="border-r border-b border-slate-100 min-h-28 bg-slate-50/50" />
          );

          const dateStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents  = getEventsForDay(day);
          const isToday    = dateStr === today;
          const isWeekend  = [0, 6].includes(new Date(year, month, day).getDay());

          return (
            <div key={day}
              className={`border-r border-b border-slate-100 min-h-28 p-1.5 ${isWeekend ? 'bg-slate-50/70' : 'bg-white'}`}>
              {/* Número del día */}
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${
                isToday ? 'text-white' : 'text-slate-600'
              }`} style={isToday ? { background: '#D61672' } : {}}>
                {day}
              </div>
              {/* Eventos */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <EventBadge key={ev.id} event={ev} onClick={onEventClick} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-slate-400 pl-1 font-semibold">
                    +{dayEvents.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vista semanal (celdas grandes con info detallada) ─────────────────────
function WeekView({ year, month, day, events, onEventClick }) {
  const startOfWeek = new Date(year, month, day);
  startOfWeek.setDate(day - startOfWeek.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const getEventsForDay = (date) => {
    const y   = date.getFullYear();
    const m   = String(date.getMonth() + 1).padStart(2, '0');
    const d   = String(date.getDate()).padStart(2, '0');
    const str = `${y}-${m}-${d}`;
    return events.filter(e => e.date === str)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* Cabecera: día de la semana + fecha */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekDays.map((date, idx) => {
          const y   = date.getFullYear();
          const m   = String(date.getMonth() + 1).padStart(2, '0');
          const d   = String(date.getDate()).padStart(2, '0');
          const str = `${y}-${m}-${d}`;
          const isToday   = str === today;
          const isWeekend = [0, 6].includes(date.getDay());
          return (
            <div key={idx}
              className={`px-2 py-3 text-center border-r border-slate-100 last:border-r-0 ${
                isToday ? 'bg-pink-50' : isWeekend ? 'bg-slate-100/50' : ''
              }`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${isWeekend ? 'text-slate-400' : 'text-slate-500'}`}>
                {DAYS[date.getDay()]}
              </p>
              <div className={`w-9 h-9 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold ${
                isToday ? 'text-white shadow-sm' : isWeekend ? 'text-slate-400' : 'text-slate-700'
              }`} style={isToday ? { background: '#D61672' } : {}}>
                {date.getDate()}
              </div>
              {/* Conteo de eventos */}
              {(() => {
                const cnt = getEventsForDay(date).length;
                return cnt > 0 ? (
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: isToday ? '#D61672' : '#fdf2f8', color: isToday ? '#fff' : '#D61672' }}>
                    {cnt}
                  </span>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>

      {/* Cuerpo: tarjetas detalladas por día */}
      <div className="grid grid-cols-7" style={{ minHeight: '520px' }}>
        {weekDays.map((date, idx) => {
          const y   = date.getFullYear();
          const m   = String(date.getMonth() + 1).padStart(2, '0');
          const d   = String(date.getDate()).padStart(2, '0');
          const str = `${y}-${m}-${d}`;
          const dayEvents = getEventsForDay(date);
          const isToday   = str === today;
          const isWeekend = [0, 6].includes(date.getDay());

          return (
            <div key={idx}
              className={`border-r border-slate-100 last:border-r-0 p-1.5 space-y-1.5 ${
                isToday   ? 'bg-pink-50/40'    :
                isWeekend ? 'bg-slate-50/70'   : ''
              }`}>
              {dayEvents.map(ev => (
                <EventCard key={ev.id} event={ev} onClick={onEventClick} />
              ))}
              {dayEvents.length === 0 && (
                <div className="h-full min-h-16 flex items-center justify-center">
                  <span className="text-slate-200 text-xs select-none">—</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function CalendarView({ tasks }) {
  const today = new Date();
  const [viewMode, setViewMode]       = useState('month');
  const [currentDate, setCurrentDate] = useState({
    year:  today.getFullYear(),
    month: today.getMonth(),
    day:   today.getDate(),
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = useMemo(() => getCalendarEvents(tasks), [tasks]);

  const navigate = (dir) => {
    if (viewMode === 'month') {
      setCurrentDate(prev => {
        let m = prev.month + dir;
        let y = prev.year;
        if (m > 11) { m = 0; y++; }
        if (m < 0)  { m = 11; y--; }
        return { ...prev, month: m, year: y };
      });
    } else {
      setCurrentDate(prev => {
        const d = new Date(prev.year, prev.month, prev.day);
        d.setDate(d.getDate() + dir * 7);
        return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      });
    }
  };

  const goToToday = () => {
    setCurrentDate({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() });
  };

  const title = viewMode === 'month'
    ? `${MONTHS[currentDate.month]} ${currentDate.year}`
    : (() => {
        const start = new Date(currentDate.year, currentDate.month, currentDate.day);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
      })();

  // Solo visitas del mes/semana actual para el contador
  const visibleEvents = viewMode === 'month'
    ? events.filter(e => {
        const [y, m] = e.date.split('-').map(Number);
        return y === currentDate.year && m === currentDate.month + 1;
      })
    : (() => {
        const start = new Date(currentDate.year, currentDate.month, currentDate.day);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return events.filter(e => {
          const d = new Date(e.date);
          return d >= start && d <= end;
        });
      })();

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendario</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {visibleEvents.length} visita{visibleEvents.length !== 1 ? 's' : ''} en este período
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Toggle vista */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setViewMode('month')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Calendar size={14} /><span>Mes</span>
            </button>
            <button onClick={() => setViewMode('week')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <CalendarDays size={14} /><span>Semana</span>
            </button>
          </div>

          {/* Navegación */}
          <button onClick={() => navigate(-1)}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button onClick={goToToday}
            className="px-3 py-2 text-xs font-bold text-white rounded-lg transition-colors"
            style={{ background: '#D61672' }}>
            Hoy
          </button>
          <button onClick={() => navigate(1)}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Título del período + leyenda */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm border-l-2 bg-pink-50" style={{ borderLeftColor: '#D61672' }} />
            <span>Programada</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm border-l-2 bg-green-50 border-green-500" />
            <span>Realizada</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm border-l-2 bg-amber-50 border-amber-400" />
            <span>Cancelada</span>
          </div>
        </div>
      </div>

      {/* Vista calendario */}
      {viewMode === 'month' ? (
        <MonthView
          year={currentDate.year}
          month={currentDate.month}
          events={events}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <WeekView
          year={currentDate.year}
          month={currentDate.month}
          day={currentDate.day}
          events={events}
          onEventClick={setSelectedEvent}
        />
      )}

      {/* Modal detalle */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
