import { useMemo, useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Download, FileText, Search } from 'lucide-react';

const INITIAL_FILTERS = {
  search: '',
  status: 'Todos',
  urgency: 'Todos',
  serviceOrder: '',
  createdBy: '',
  dateFrom: '',
  dateTo: '',
  dueDateFrom: '',
  dueDateTo: '',
};

function exportToCSV(tasks) {
  const headers = [
    'Orden de Servicio',
    'Cliente',
    'Cédula/RUC',
    'Teléfono',
    'Dirección',
    'Equipo',
    'Tipo',
    'Urgencia',
    'Estado',
    'Fecha Vencimiento',
    'Observaciones',
    'Creado Por',
    'Fecha Creación',
    'Completado Por',
    'Fecha Completado',
    'Obs. Cierre',
  ];

  const rows = tasks.map(t => [
    t.serviceOrder || '',
    t.clientName || '',
    t.identification || '',
    t.clientPhone || '',
    t.clientAddress || '',
    t.equipment || '',
    t.type || '',
    t.urgency || '',
    t.status || '',
    t.dueDate || '',
    t.observations || '',
    t.createdBy || '',
    t.createdAt ? new Date(t.createdAt).toLocaleString('es-EC') : '',
    t.completedBy || '',
    t.completedAt ? new Date(t.completedAt).toLocaleString('es-EC') : '',
    t.completionObservations || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_mantenimientos_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(tasks) {
  const headers = [
    'Orden de Servicio', 'Cliente', 'Cédula/RUC', 'Teléfono', 'Dirección',
    'Equipo', 'Tipo', 'Urgencia', 'Estado', 'Fecha Vencimiento',
    'Observaciones', 'Creado Por', 'Fecha Creación',
    'Completado Por', 'Fecha Completado', 'Obs. Cierre',
  ];

  const rows = tasks.map(t => [
    t.serviceOrder || '',
    t.clientName || '',
    t.identification || '',
    t.clientPhone || '',
    t.clientAddress || '',
    t.equipment || '',
    t.type || '',
    t.urgency || '',
    t.status || '',
    t.dueDate || '',
    t.observations || '',
    t.createdBy || '',
    t.createdAt ? new Date(t.createdAt).toLocaleString('es-EC') : '',
    t.completedBy || '',
    t.completedAt ? new Date(t.completedAt).toLocaleString('es-EC') : '',
    t.completionObservations || '',
  ]);

  const tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Mantenimientos</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>
      <![endif]-->
      <style>
        th { background-color: #1e40af; color: white; font-weight: bold; padding: 8px; }
        td { padding: 6px 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body></html>`;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_mantenimientos_${new Date().toISOString().split('T')[0]}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports({ tasks }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const activeFilterCount = Object.entries(filters).filter(([key, val]) =>
    key === 'status' || key === 'urgency' ? val !== 'Todos' : val !== ''
  ).length;

  const uniqueUsers = useMemo(() => {
    const users = tasks.map(t => t.createdBy).filter(Boolean);
    return [...new Set(users)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filters.search && !t.clientName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.serviceOrder && !t.serviceOrder?.toLowerCase().includes(filters.serviceOrder.toLowerCase())) return false;
      if (filters.status !== 'Todos' && t.status !== filters.status) return false;
      if (filters.urgency !== 'Todos' && t.urgency !== filters.urgency) return false;
      if (filters.createdBy && t.createdBy !== filters.createdBy) return false;
      if (filters.dateFrom) {
        const created = t.createdAt?.split('T')[0];
        if (!created || created < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const created = t.createdAt?.split('T')[0];
        if (!created || created > filters.dateTo) return false;
      }
      if (filters.dueDateFrom && t.dueDate < filters.dueDateFrom) return false;
      if (filters.dueDateTo && t.dueDate > filters.dueDateTo) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks, filters]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reportes</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filteredTasks.length} de {tasks.length} registros</p>
        </div>

        {/* Botón exportar */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            <span>Exportar</span>
            <ChevronDown size={14} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden">
              <button
                onClick={() => { exportToExcel(filteredTasks); setShowExportMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="p-1.5 bg-green-100 rounded">
                  <FileText size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Excel (.xls)</p>
                  <p className="text-xs text-slate-400">Con formato y estilos</p>
                </div>
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => { exportToCSV(filteredTasks); setShowExportMenu(false); }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="p-1.5 bg-blue-100 rounded">
                  <FileText size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">CSV (.csv)</p>
                  <p className="text-xs text-slate-400">Compatible con todo</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra búsqueda + filtros */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filters.search && (
            <button onClick={() => handleFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Filter size={16} />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Filtros avanzados</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 font-medium">
                <X size={12} /><span>Limpiar todos</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Orden de servicio</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: OS-2026-001"
                  value={filters.serviceOrder}
                  onChange={(e) => handleFilter('serviceOrder', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                {filters.serviceOrder && (
                  <button onClick={() => handleFilter('serviceOrder', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilter('status', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Urgencia</label>
              <select
                value={filters.urgency}
                onChange={(e) => handleFilter('urgency', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Todos">Todas las urgencias</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Usuario</label>
              <select
                value={filters.createdBy}
                onChange={(e) => handleFilter('createdBy', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los usuarios</option>
                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Creado desde</label>
              <div className="relative">
                <input type="date" value={filters.dateFrom} onChange={(e) => handleFilter('dateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {filters.dateFrom && <button onClick={() => handleFilter('dateFrom', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Creado hasta</label>
              <div className="relative">
                <input type="date" value={filters.dateTo} onChange={(e) => handleFilter('dateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {filters.dateTo && <button onClick={() => handleFilter('dateTo', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vence desde</label>
              <div className="relative">
                <input type="date" value={filters.dueDateFrom} onChange={(e) => handleFilter('dueDateFrom', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {filters.dueDateFrom && <button onClick={() => handleFilter('dueDateFrom', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Vence hasta</label>
              <div className="relative">
                <input type="date" value={filters.dueDateTo} onChange={(e) => handleFilter('dueDateTo', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {filters.dueDateTo && <button onClick={() => handleFilter('dueDateTo', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
            </div>
          </div>

          {/* Tags filtros activos */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {filters.status !== 'Todos' && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                  <span>Estado: {filters.status}</span>
                  <button onClick={() => handleFilter('status', 'Todos')}><X size={12} /></button>
                </span>
              )}
              {filters.urgency !== 'Todos' && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                  <span>Urgencia: {filters.urgency}</span>
                  <button onClick={() => handleFilter('urgency', 'Todos')}><X size={12} /></button>
                </span>
              )}
              {filters.serviceOrder && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                  <span>OS: {filters.serviceOrder}</span>
                  <button onClick={() => handleFilter('serviceOrder', '')}><X size={12} /></button>
                </span>
              )}
              {filters.createdBy && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                  <span>Usuario: {filters.createdBy}</span>
                  <button onClick={() => handleFilter('createdBy', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dateFrom && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  <span>Creado desde: {filters.dateFrom}</span>
                  <button onClick={() => handleFilter('dateFrom', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dateTo && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  <span>Creado hasta: {filters.dateTo}</span>
                  <button onClick={() => handleFilter('dateTo', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dueDateFrom && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  <span>Vence desde: {filters.dueDateFrom}</span>
                  <button onClick={() => handleFilter('dueDateFrom', '')}><X size={12} /></button>
                </span>
              )}
              {filters.dueDateTo && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  <span>Vence hasta: {filters.dueDateTo}</span>
                  <button onClick={() => handleFilter('dueDateTo', '')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">OS</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Cédula/RUC</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Vence</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Urgencia</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Creado por</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Completado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map(task => {
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = task.dueDate < today && task.status !== 'Completado' && task.status !== 'Cancelado';
                return (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-purple-600 font-semibold">
                        {task.serviceOrder || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{task.clientName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">{task.identification || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{task.type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : task.dueDate === today
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {task.dueDate}
                        {isOverdue && ' ⚠️'}
                        {task.dueDate === today && !isOverdue && ' 📅'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.urgency === 'Alta' ? 'bg-red-100 text-red-700' :
                        task.urgency === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'Completado' ? 'bg-green-100 text-green-700' :
                        task.status === 'Cancelado' ? 'bg-slate-100 text-slate-500' :
                        task.status === 'En Proceso' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500">
                        <p className="truncate max-w-32">{task.createdBy || '—'}</p>
                        {task.createdAt && (
                          <p className="text-slate-400">{new Date(task.createdAt).toLocaleDateString('es-EC')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.completedBy ? (
                        <div className="text-xs text-green-600">
                          <p className="truncate max-w-32">{task.completedBy}</p>
                          {task.completedAt && (
                            <p className="text-green-400">{new Date(task.completedAt).toLocaleDateString('es-EC')}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No hay registros con estos filtros.
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