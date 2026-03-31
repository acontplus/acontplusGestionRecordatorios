import { useMemo, useState } from 'react';
import {
  Filter, X, ChevronDown, ChevronUp, Download,
  FileText, Search, ChevronRight, Calendar, User,
  Wrench, Clock
} from 'lucide-react';
import Pagination from './Pagination.jsx';
import { usePagination } from '../hooks/usePagination.js';
import { useTiposVisita } from '../hooks/useTiposVisita.js';
import { useTecnicos } from '../hooks/useTecnicos.js';

// ── Fecha local (evita bug UTC Ecuador) ───────────────────────────────────
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('es-EC') : '—';
const fmtFull = (iso) => iso ? new Date(iso).toLocaleString('es-EC') : '—';
const fmtDate = (str) => {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
};

// ── Estado inicial de filtros ──────────────────────────────────────────────
const INITIAL_FILTERS = {
  search:          '',
  serviceOrder:    '',
  status:          'Todos',
  createdBy:       '',
  dateFrom:        '',
  dateTo:          '',
  // Filtros de visita
  visitTecnico:    '',
  visitTipo:       '',
  visitStatus:     'Todos',
  visitDateFrom:   '',
  visitDateTo:     '',
};

// ── Exportar CSV (tarea + visitas) ────────────────────────────────────────
function exportToCSV(tasks) {
  const headers = [
    'OS', 'Cliente', 'Cédula/RUC', 'Teléfono', 'Dirección',
    'Estado Tarea', 'Observaciones Tarea', 'Creado Por', 'Fecha Creación',
    'Completado Por', 'Fecha Completado', 'Obs. Cierre Tarea',
    // Visita
    '— VISITA —', 'Fecha Visita', 'Hora', 'Tipo Visita', 'Urgencia',
    'Estado Visita', 'Técnico', 'Obs. Visita',
    'Completado At', 'Completado By', 'Obs. Cierre Visita',
  ];

  const rows = [];
  tasks.forEach(t => {
    const baseRow = [
      t.serviceOrder || '', t.clientName || '', t.identification || '',
      t.clientPhone || '', t.clientAddress || '',
      t.status || '', t.observations || '',
      t.createdBy || '', fmtFull(t.createdAt),
      t.completedBy || '', fmtFull(t.completedAt), t.completionObservations || '',
    ];

    const visits = t.visits?.filter(v => v.scheduledDate) || [];
    if (visits.length === 0) {
      rows.push([...baseRow, '', '', '', '', '', '', '', '', '', '', '']);
    } else {
      visits.forEach(v => {
        rows.push([
          ...baseRow,
          '★',
          v.scheduledDate || '', v.scheduledTime || '',
          v.type || '', v.urgency || '',
          v.status || '', v.technician || '', v.observations || '',
          fmtFull(v.completedAt), v.completedBy || '', v.closingObservations || '',
        ]);
      });
    }
  });

  const csv = [headers, ...rows]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte_${getLocalDate()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Exportar Excel ────────────────────────────────────────────────────────
function exportToExcel(tasks) {
  const headers = [
    'OS', 'Cliente', 'Cédula/RUC', 'Teléfono', 'Dirección',
    'Estado Tarea', 'Observaciones', 'Creado Por', 'Fecha Creación',
    'Completado Por', 'Fecha Completado', 'Obs. Cierre',
    'VISITA', 'Fecha Visita', 'Hora', 'Tipo Visita', 'Urgencia',
    'Estado Visita', 'Técnico', 'Obs. Visita',
    'Realizada At', 'Realizada By', 'Obs. Cierre Visita',
  ];

  const rows = [];
  tasks.forEach(t => {
    const base = [
      t.serviceOrder || '', t.clientName || '', t.identification || '',
      t.clientPhone || '', t.clientAddress || '',
      t.status || '', t.observations || '',
      t.createdBy || '', fmtFull(t.createdAt),
      t.completedBy || '', fmtFull(t.completedAt), t.completionObservations || '',
    ];
    const visits = t.visits?.filter(v => v.scheduledDate) || [];
    if (visits.length === 0) {
      rows.push([...base, '', '', '', '', '', '', '', '', '', '', '']);
    } else {
      visits.forEach(v => {
        rows.push([
          ...base, '★',
          v.scheduledDate || '', v.scheduledTime || '',
          v.type || '', v.urgency || '',
          v.status || '', v.technician || '', v.observations || '',
          fmtFull(v.completedAt), v.completedBy || '', v.closingObservations || '',
        ]);
      });
    }
  });

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]>
<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Reporte</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>
<![endif]-->
<style>
  th { background:#1e40af; color:#fff; font-weight:bold; padding:8px; font-size:11px; }
  td { padding:6px 8px; border:1px solid #e2e8f0; font-size:11px; }
  .tarea-row td { background:#f0f9ff; font-weight:600; }
  .visit-row td { background:#fdf2f8; padding-left:20px; }
</style>
</head>
<body>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>
    ${rows.map(row => `<tr>${row.map((c, i) => `<td>${c}</td>`).join('')}</tr>`).join('')}
  </tbody>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `reporte_${getLocalDate()}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Fila de visita (sub-fila) ─────────────────────────────────────────────
function VisitRow({ visit }) {
  const today       = getLocalDate();
  const isOverdue   = visit.status === 'Programada' && visit.scheduledDate < today;
  const isToday     = visit.status === 'Programada' && visit.scheduledDate === today;

  const statusCls = {
    'Programada': 'bg-blue-100 text-blue-700',
    'Realizada':  'bg-green-100 text-green-700',
    'Cancelada':  'bg-amber-100 text-amber-700',
    'Anulada':    'bg-red-100 text-red-600',
  }[visit.status] || 'bg-slate-100 text-slate-500';

  const urgencyCls = {
    'Alta':  'bg-red-100 text-red-700',
    'Media': 'bg-yellow-100 text-yellow-700',
    'Baja':  'bg-green-100 text-green-700',
  }[visit.urgency] || '';

  return (
    <tr className="bg-pink-50/40 hover:bg-pink-50 border-b border-pink-100">
      {/* Indent + icono visita */}
      <td className="px-3 py-2 pl-8 whitespace-nowrap">
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D61672' }} />
          <div className="flex items-center space-x-1">
            <Calendar size={12} className="text-pink-400 flex-shrink-0" />
            <span className={`text-xs font-semibold ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
              {fmtDate(visit.scheduledDate)}
              {visit.scheduledTime && ` · ${visit.scheduledTime}`}
            </span>
            {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded">⚠️ Retrasada</span>}
            {isToday && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1 rounded">📅 Hoy</span>}
          </div>
        </div>
      </td>

      {/* Tipo */}
      <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
        {visit.type ? (
          <div className="flex items-center space-x-1">
            <Wrench size={11} className="text-slate-400" />
            <span>{visit.type}</span>
          </div>
        ) : '—'}
      </td>

      {/* Estado visita */}
      <td className="px-3 py-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
          {visit.status}
        </span>
      </td>

      {/* Urgencia */}
      <td className="px-3 py-2">
        {visit.urgency ? (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyCls}`}>
            {visit.urgency}
          </span>
        ) : '—'}
      </td>

      {/* Técnico */}
      <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
        {visit.technician ? (
          <div className="flex items-center space-x-1">
            <User size={11} className="text-slate-400" />
            <span className="truncate max-w-28">{visit.technician}</span>
          </div>
        ) : '—'}
      </td>

      {/* Observaciones visita */}
      <td className="px-3 py-2 text-xs text-slate-500 max-w-xs">
        {visit.observations ? (
          <p className="truncate" title={visit.observations}>{visit.observations}</p>
        ) : '—'}
      </td>

      {/* Cierre visita */}
      <td className="px-3 py-2" colSpan={2}>
        {visit.status === 'Realizada' && visit.completedAt ? (
          <div className="text-xs text-green-700">
            <p>✅ {fmt(visit.completedAt)}</p>
            {visit.completedBy && <p className="text-green-500 truncate max-w-28">{visit.completedBy}</p>}
            {visit.closingObservations && (
              <p className="text-green-600 italic truncate max-w-32" title={visit.closingObservations}>
                {visit.closingObservations}
              </p>
            )}
          </div>
        ) : <span className="text-slate-300 text-xs">—</span>}
      </td>
    </tr>
  );
}

// ── Fila de tarea (con expansión) ─────────────────────────────────────────
function TaskRow({ task, expanded, onToggle }) {
  const visits = task.visits?.filter(v => v.scheduledDate) || [];

  const statusCls = {
    'Completado': 'bg-green-100 text-green-700',
    'Cancelado':  'bg-slate-100 text-slate-500',
    'En Proceso': 'bg-blue-100 text-blue-700',
    'Pendiente':  'bg-yellow-100 text-yellow-700',
  }[task.status] || 'bg-yellow-100 text-yellow-700';

  return (
    <>
      {/* Fila principal de la tarea */}
      <tr
        className={`border-b border-slate-100 transition-colors cursor-pointer ${
          expanded ? 'bg-slate-50' : 'hover:bg-slate-50'
        }`}
        onClick={onToggle}
      >
        {/* Toggle expandir */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <button
              className={`p-0.5 rounded transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ${
                visits.length > 0 ? 'text-slate-500 hover:text-slate-800' : 'text-slate-200 cursor-default'
              }`}>
              <ChevronRight size={14} />
            </button>
            <span className="font-mono text-xs font-bold text-purple-700">
              {task.serviceOrder || '—'}
            </span>
          </div>
        </td>

        {/* Cliente */}
        <td className="px-3 py-3">
          <p className="font-semibold text-slate-800 text-sm">{task.clientName}</p>
          <p className="text-xs text-slate-400 font-mono">{task.identification || ''}</p>
        </td>

        {/* Teléfono / dirección */}
        <td className="px-3 py-3 text-xs text-slate-500">
          {task.clientPhone && <p>{task.clientPhone}</p>}
          {task.clientAddress && <p className="truncate max-w-28">{task.clientAddress}</p>}
        </td>

        {/* Estado tarea */}
        <td className="px-3 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
            {task.status}
          </span>
        </td>

        {/* Visitas badge */}
        <td className="px-3 py-3 text-center">
          {visits.length > 0 ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: '#fdf2f8', color: '#D61672' }}>
              <Calendar size={10} />
              <span>{visits.length}</span>
            </span>
          ) : (
            <span className="text-slate-300 text-xs">—</span>
          )}
        </td>

        {/* Observaciones tarea */}
        <td className="px-3 py-3 text-xs text-slate-500 max-w-xs">
          {task.observations
            ? <p className="truncate" title={task.observations}>{task.observations}</p>
            : <span className="text-slate-300">—</span>}
        </td>

        {/* Creado por */}
        <td className="px-3 py-3">
          <div className="text-xs text-slate-500">
            <p className="truncate max-w-28">{task.createdBy || '—'}</p>
            <p className="text-slate-400">{fmt(task.createdAt)}</p>
          </div>
        </td>

        {/* Completado por */}
        <td className="px-3 py-3">
          {task.completedBy ? (
            <div className="text-xs text-green-600">
              <p className="truncate max-w-28">{task.completedBy}</p>
              <p className="text-green-400">{fmt(task.completedAt)}</p>
            </div>
          ) : <span className="text-slate-300 text-xs">—</span>}
        </td>
      </tr>

      {/* Sub-filas de visitas */}
      {expanded && visits.length > 0 && (
        <>
          {/* Cabecera de visitas */}
          <tr className="bg-pink-50 border-b border-pink-100">
            <td className="pl-8 pr-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider whitespace-nowrap">
              📅 Fecha visita
            </td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Tipo</td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Estado</td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Urgencia</td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Técnico</td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider">Observaciones</td>
            <td className="px-3 py-1.5 text-[10px] font-bold text-pink-600 uppercase tracking-wider" colSpan={2}>Cierre</td>
          </tr>
          {visits
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
            .map((visit, i) => (
              <VisitRow key={visit.id || i} visit={visit} />
            ))
          }
        </>
      )}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function Reports({ tasks, user }) {
  const [filters,        setFilters]        = useState(INITIAL_FILTERS);
  const [showFilters,    setShowFilters]     = useState(false);
  const [showExportMenu, setShowExportMenu]  = useState(false);
  const [expandedTasks,  setExpandedTasks]   = useState(new Set());

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const toggleExpand = (id) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll   = () => setExpandedTasks(new Set(filteredTasks.map(t => t.id)));
  const collapseAll = () => setExpandedTasks(new Set());

  // ── Catálogos desde Firestore ────────────────────────────────────────────
  const { tiposParaSelect }      = useTiposVisita(user);
  const { tecnicos }             = useTecnicos(user);

  // Valores únicos para selects de filtros de tarea
  const uniqueUsers = useMemo(() => [...new Set(tasks.map(t => t.createdBy).filter(Boolean))], [tasks]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    (k === 'status' || k === 'visitStatus') ? v !== 'Todos' : v !== ''
  ).length;

  // ── Lógica de filtrado ──────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Filtros de tarea
      if (filters.search && !t.clientName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.serviceOrder && !t.serviceOrder?.toLowerCase().includes(filters.serviceOrder.toLowerCase())) return false;
      if (filters.status !== 'Todos' && t.status !== filters.status) return false;
      if (filters.createdBy && t.createdBy !== filters.createdBy) return false;
      if (filters.dateFrom) {
        const c = t.createdAt?.split('T')[0];
        if (!c || c < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const c = t.createdAt?.split('T')[0];
        if (!c || c > filters.dateTo) return false;
      }

      // Filtros de visita: si hay algún filtro de visita activo,
      // la tarea debe tener AL MENOS UNA visita que cumpla todos los criterios
      const hasVisitFilter =
        filters.visitTecnico || filters.visitTipo ||
        filters.visitStatus !== 'Todos' ||
        filters.visitDateFrom || filters.visitDateTo;

      if (hasVisitFilter) {
        const visits = t.visits?.filter(v => v.scheduledDate) || [];
        const match = visits.some(v => {
          if (filters.visitTecnico && !v.technician?.toLowerCase().includes(filters.visitTecnico.toLowerCase())) return false;
          if (filters.visitTipo    && v.type    !== filters.visitTipo)    return false;
          if (filters.visitStatus !== 'Todos' && v.status !== filters.visitStatus) return false;
          if (filters.visitDateFrom && v.scheduledDate < filters.visitDateFrom) return false;
          if (filters.visitDateTo   && v.scheduledDate > filters.visitDateTo)   return false;
          return true;
        });
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, filters]);

  const reportPagination = usePagination(filteredTasks, 15);

  // Expandir automáticamente si hay filtros de visita activos
  const autoExpand = filters.visitTecnico || filters.visitTipo ||
    filters.visitStatus !== 'Todos' || filters.visitDateFrom || filters.visitDateTo;

  const displayedExpanded = autoExpand
    ? new Set(filteredTasks.map(t => t.id))
    : expandedTasks;

  const totalVisitas = filteredTasks.reduce((s, t) => s + (t.visits?.filter(v => v.scheduledDate).length || 0), 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reportes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} · {totalVisitas} visita{totalVisitas !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Exportar */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download size={16} /><span>Exportar</span><ChevronDown size={14} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
              <button onClick={() => { exportToExcel(filteredTasks); setShowExportMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <div className="p-1.5 bg-green-100 rounded"><FileText size={14} className="text-green-600" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Excel (.xls)</p>
                  <p className="text-xs text-slate-400">Con tareas y visitas</p>
                </div>
              </button>
              <div className="border-t border-slate-100" />
              <button onClick={() => { exportToCSV(filteredTasks); setShowExportMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
                <div className="p-1.5 bg-blue-100 rounded"><FileText size={14} className="text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-700">CSV (.csv)</p>
                  <p className="text-xs text-slate-400">Con tareas y visitas</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra búsqueda + botón filtros */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por cliente..."
            value={filters.search}
            onChange={e => handleFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#D61672' }} />
          {filters.search && (
            <button onClick={() => handleFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            activeFilterCount > 0 ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
          style={activeFilterCount > 0 ? { background: 'linear-gradient(135deg, #D61672, #FFA901)', borderColor: 'transparent' } : {}}>
          <Filter size={16} />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-pink-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">Filtros avanzados</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700">
                <X size={12} /><span>Limpiar todos</span>
              </button>
            )}
          </div>

          {/* ── Filtros de TAREA ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📋 Por tarea</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Orden de servicio</label>
                <input type="text" placeholder="Ej: OS-001" value={filters.serviceOrder}
                  onChange={e => handleFilter('serviceOrder', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none font-mono" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Estado de tarea</label>
                <select value={filters.status} onChange={e => handleFilter('status', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="Todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Creado por</label>
                <select value={filters.createdBy} onChange={e => handleFilter('createdBy', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="">Todos los usuarios</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Creado desde</label>
                <input type="date" value={filters.dateFrom}
                  onChange={e => handleFilter('dateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Creado hasta</label>
                <input type="date" value={filters.dateTo}
                  onChange={e => handleFilter('dateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* ── Filtros de VISITA ── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#D61672' }}>📅 Por visita</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Estado de visita</label>
                <select value={filters.visitStatus} onChange={e => handleFilter('visitStatus', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="Todos">Todos</option>
                  <option value="Programada">Programada</option>
                  <option value="Realizada">Realizada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Anulada">Anulada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de visita</label>
                <select value={filters.visitTipo} onChange={e => handleFilter('visitTipo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="">Todos los tipos</option>
                  {tiposParaSelect.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Técnico</label>
                <select value={filters.visitTecnico} onChange={e => handleFilter('visitTecnico', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="">Todos los técnicos</option>
                  {tecnicos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}{t.email ? ` (${t.email})` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Visita desde</label>
                <input type="date" value={filters.visitDateFrom}
                  onChange={e => handleFilter('visitDateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Visita hasta</label>
                <input type="date" value={filters.visitDateTo}
                  onChange={e => handleFilter('visitDateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Chips de filtros activos */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
              {filters.status !== 'Todos'       && <Chip label={`Estado: ${filters.status}`}       onRemove={() => handleFilter('status', 'Todos')} />}
              {filters.serviceOrder              && <Chip label={`OS: ${filters.serviceOrder}`}      onRemove={() => handleFilter('serviceOrder', '')} />}
              {filters.createdBy                 && <Chip label={`Usuario: ${filters.createdBy}`}   onRemove={() => handleFilter('createdBy', '')} />}
              {filters.dateFrom                  && <Chip label={`Desde: ${filters.dateFrom}`}       onRemove={() => handleFilter('dateFrom', '')} />}
              {filters.dateTo                    && <Chip label={`Hasta: ${filters.dateTo}`}         onRemove={() => handleFilter('dateTo', '')} />}
              {filters.visitStatus !== 'Todos'   && <Chip label={`Visita: ${filters.visitStatus}`}  onRemove={() => handleFilter('visitStatus', 'Todos')} color="pink" />}
              {filters.visitTipo                 && <Chip label={`Tipo: ${filters.visitTipo}`}       onRemove={() => handleFilter('visitTipo', '')} color="pink" />}
              {filters.visitTecnico              && <Chip label={`Técnico: ${filters.visitTecnico}`} onRemove={() => handleFilter('visitTecnico', '')} color="pink" />}
              {filters.visitDateFrom             && <Chip label={`Visita desde: ${filters.visitDateFrom}`} onRemove={() => handleFilter('visitDateFrom', '')} color="pink" />}
              {filters.visitDateTo               && <Chip label={`Visita hasta: ${filters.visitDateTo}`}   onRemove={() => handleFilter('visitDateTo', '')} color="pink" />}
            </div>
          )}
        </div>
      )}

      {/* Controles expandir/colapsar */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {reportPagination.startIndex}–{reportPagination.endIndex} de {filteredTasks.length} tareas
          </p>
          <div className="flex items-center space-x-2">
            <button onClick={expandAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              Expandir todo
            </button>
            <button onClick={collapseAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              Colapsar todo
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 whitespace-nowrap text-xs">OS</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs">Cliente</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs whitespace-nowrap">Contacto</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs">Estado</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs text-center whitespace-nowrap">Visitas</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs">Observaciones</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs whitespace-nowrap">Creado por</th>
                <th className="text-left px-3 py-3 font-semibold text-slate-200 text-xs whitespace-nowrap">Completado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportPagination.paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No hay registros con estos filtros.
                  </td>
                </tr>
              )}
              {reportPagination.paginatedItems.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  expanded={displayedExpanded.has(task.id)}
                  onToggle={() => !autoExpand && toggleExpand(task.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 pb-4 pt-2">
          <Pagination
            currentPage={reportPagination.currentPage}
            totalPages={reportPagination.totalPages}
            onPageChange={reportPagination.goToPage}
            startIndex={reportPagination.startIndex}
            endIndex={reportPagination.endIndex}
            totalItems={reportPagination.totalItems}
          />
        </div>
      </div>
    </div>
  );
}

// ── Chip de filtro activo ─────────────────────────────────────────────────
function Chip({ label, onRemove, color }) {
  const cls = color === 'pink'
    ? 'bg-pink-100 text-pink-700 border-pink-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${cls}`}>
      <span>{label}</span>
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><X size={11} /></button>
    </span>
  );
}
