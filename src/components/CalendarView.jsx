import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, CalendarDays } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function getCalendarEvents(tasks) {
  const events = [];
  tasks.forEach(task => {
    // Evento de la tarea principal
    if (task.dueDate) {
      events.push({
        id: `task-${task.id}`,
        date: task.dueDate,
        time: '',
        title: task.clientName,
        subtitle: task.type,
        type: 'task',
        status: task.status,
        urgency: task.urgency,
        task,
      });
    }
    // Eventos de visitas
    if (task.visits?.length) {
      task.visits.forEach(visit => {
        if (visit.scheduledDate) {
          events.push({
            id: `visit-${visit.id}`,
            date: visit.scheduledDate,
            time: visit.scheduledTime || '',
            title: task.clientName,
            subtitle: visit.technician || task.type,
            type: 'visit',
            visitStatus: visit.status,
            visitType: visit.visitStatus,
            task,
            visit,
          });
        }
      });
    }
  });
  return events;
}

function EventBadge({ event, onClick }) {
  const isTask = event.type === 'task';
  const isVisit = event.type === 'visit';

  const taskColor = {
    'Completado': 'bg-green-100 text-green-700 border-green-200',
    'Cancelado':  'bg-slate-100 text-slate-500 border-slate-200',
    'En Proceso': 'bg-blue-100 text-blue-700 border-blue-200',
    'Pendiente':  'bg-yellow-100 text-yellow-700 border-yellow-200',
  }[event.status] || 'bg-yellow-100 text-yellow-700 border-yellow-200';

  const visitColor = {
    'Programada': 'border-l-2 bg-pink-50 text-pink-700 border-pink-300',
    'Realizada':  'border-l-2 bg-green-50 text-green-700 border-green-300',
    'Cancelada':  'border-l-2 bg-slate-50 text-slate-500 border-slate-300',
  }[event.visitStatus] || 'border-l-2 bg-pink-50 text-pink-700 border-pink-300';

  return (
    <button
      onClick={() => onClick(event)}
      className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate border transition-colors hover:opacity-80 ${
        isTask ? taskColor : visitColor
      }`}
      title={`${event.title} — ${event.subtitle}${event.time ? ` (${event.time})` : ''}`}
    >
      {event.time && <span className="font-bold mr-1">{event.time}</span>}
      {event.title}
    </button>
  );
}

function MonthView({ year, month, events, onEventClick }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Cabecera días */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAYS.map(day => (
          <div key={day} className="px-2 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="border-r border-b border-slate-100 min-h-24 bg-slate-50" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = getEventsForDay(day);
          const isToday = dateStr === today;
          const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());

          return (
            <div
              key={day}
              className={`border-r border-b border-slate-100 min-h-24 p-1 ${
                isWeekend ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                isToday
                  ? 'text-white'
                  : 'text-slate-700'
              }`}
                style={isToday ? { background: '#D61672' } : {}}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <EventBadge key={event.id} event={event} onClick={onEventClick} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-slate-400 pl-1">+{dayEvents.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ year, month, day, events, onEventClick }) {
  const startOfWeek = new Date(year, month, day);
  startOfWeek.setDate(day - startOfWeek.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date().toISOString().split('T')[0];

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {weekDays.map((date, idx) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === today;
          return (
            <div key={idx} className={`px-2 py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-pink-50' : ''}`}>
              <p className="text-xs font-bold text-slate-500 uppercase">{DAYS[date.getDay()]}</p>
              <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold ${
                isToday ? 'text-white' : 'text-slate-700'
              }`} style={isToday ? { background: '#D61672' } : {}}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-64">
        {weekDays.map((date, idx) => {
          const dayEvents = getEventsForDay(date);
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === today;
          return (
            <div key={idx} className={`border-r border-slate-100 last:border-r-0 p-2 space-y-1 ${isToday ? 'bg-pink-50 bg-opacity-30' : ''}`}>
              {dayEvents.map(event => (
                <EventBadge key={event.id} event={event} onClick={onEventClick} />
              ))}
              {dayEvents.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-slate-200 text-xs">—</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;
  const isTask = event.type === 'task';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-white text-opacity-70">
                {isTask ? '📋 Tarea' : '📅 Visita programada'}
              </p>
              <h3 className="font-bold text-white text-base mt-0.5">{event.title}</h3>
              <p className="text-xs text-white text-opacity-80">{event.subtitle}</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-20 rounded-lg">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Fecha</p>
              <p className="text-sm font-bold text-slate-800">{event.date}</p>
            </div>
            {event.time && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Hora</p>
                <p className="text-sm font-bold text-slate-800">{event.time}</p>
              </div>
            )}
          </div>

          {isTask && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Estado</p>
                  <p className="text-sm font-bold text-slate-800">{event.status}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Urgencia</p>
                  <p className="text-sm font-bold text-slate-800">{event.urgency}</p>
                </div>
              </div>
              {event.task?.clientPhone && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Teléfono</p>
                  <p className="text-sm font-bold text-slate-800">{event.task.clientPhone}</p>
                </div>
              )}
            </>
          )}

          {!isTask && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Estado visita</p>
                  <p className="text-sm font-bold text-slate-800">{event.visitStatus}</p>
                </div>
                {event.visit?.visitStatus && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Tipo</p>
                    <p className="text-sm font-bold text-slate-800">{event.visit.visitStatus}</p>
                  </div>
                )}
              </div>
              {event.visit?.dueDate && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Fecha límite</p>
                  <p className="text-sm font-bold text-orange-800">{event.visit.dueDate}</p>
                </div>
              )}
              {event.visit?.observations && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Observaciones</p>
                  <p className="text-sm text-slate-700">{event.visit.observations}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 text-white font-bold rounded-xl text-sm"
            style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarView({ tasks }) {
  const today = new Date();
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const events = useMemo(() => getCalendarEvents(tasks), [tasks]);

  const navigate = (dir) => {
    if (viewMode === 'month') {
      setCurrentDate(prev => {
        let m = prev.month + dir;
        let y = prev.year;
        if (m > 11) { m = 0; y++; }
        if (m < 0) { m = 11; y--; }
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

  const currentMonthEvents = events.filter(e => {
    const [y, m] = e.date.split('-').map(Number);
    return y === currentDate.year && m === currentDate.month + 1;
  });

  const title = viewMode === 'month'
    ? `${MONTHS[currentDate.month]} ${currentDate.year}`
    : (() => {
        const start = new Date(currentDate.year, currentDate.month, currentDate.day);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
      })();

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendario</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {events.length} evento{events.length !== 1 ? 's' : ''} en total
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle vista */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              <Calendar size={14} /><span>Mes</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
            >
              <CalendarDays size={14} /><span>Semana</span>
            </button>
          </div>

          {/* Navegación */}
          <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button onClick={goToToday}
            className="px-3 py-2 text-xs font-bold text-white rounded-lg transition-colors"
            style={{ background: '#D61672' }}>
            Hoy
          </button>
          <button onClick={() => navigate(1)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Título del período */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-300" />
            <span>Tarea</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm border-l-2 bg-pink-100 border-pink-400" />
            <span>Visita</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
            <span>Completado</span>
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