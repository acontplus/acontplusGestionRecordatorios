import { useState, useRef } from 'react';
import {
  X, Upload, Download, CheckCircle, AlertCircle,
  Loader2, FileText, Trash2, Users
} from 'lucide-react';

// ─── Plantilla de descarga ─────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = ['Nombre', 'Cedula_RUC', 'Telefono', 'Direccion'];
  const example = [
    ['Juan Pérez', '1712345678', '0991234567', 'Av. Principal 123'],
    ['Empresa ABC S.A.', '1790123456001', '022345678', 'Calle 5 de Junio 456'],
  ];
  const csv = [headers, ...example]
    .map(r => r.map(c => `"${c}"`).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'plantilla_clientes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Parsear Excel/CSV usando SheetJS ─────────────────────────────────────────
async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Mapear encabezados flexibles a campos internos
function normalizeRow(raw) {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.entries(raw).find(
        ([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (found && String(found[1]).trim()) return String(found[1]).trim();
    }
    return '';
  };
  return {
    name:           get('nombre', 'name', 'cliente', 'razonsocial'),
    identification: get('cedularuc', 'cedula', 'ruc', 'identification', 'id'),
    phone:          get('telefono', 'phone', 'celular', 'movil'),
    address:        get('direccion', 'address', 'domicilio'),
  };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ClientImportModal({ existingClients, onImport, onClose }) {
  const [step,         setStep]         = useState('upload');   // upload | preview | result
  const [rows,         setRows]         = useState([]);
  const [isParsing,    setIsParsing]    = useState(false);
  const [isImporting,  setIsImporting]  = useState(false);
  const [result,       setResult]       = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileRef = useRef();

  const existingIds = new Set(existingClients.map(c => c.identification?.replace(/\s/g, '')));

  // Validar filas
  const validated = rows.map(row => {
    const errors = [];
    if (!row.name)           errors.push('Nombre vacío');
    if (!row.identification) errors.push('Cédula/RUC vacío');
    else if (existingIds.has(row.identification.replace(/\s/g, '')))
      errors.push('Ya existe en el sistema');
    return { ...row, errors, valid: errors.length === 0 };
  });

  const validCount   = validated.filter(r => r.valid).length;
  const invalidCount = validated.length - validCount;

  const handleFile = async (file) => {
    if (!file) return;
    setIsParsing(true);
    try {
      const raw      = await parseFile(file);
      const normalized = raw.map(normalizeRow).filter(r => r.name || r.identification);
      setRows(normalized);
      setStep('preview');
    } catch (err) {
      alert('Error al leer el archivo. Asegúrate de que sea .xlsx o .csv válido.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemoveRow = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    const toImport = validated.filter(r => r.valid);
    const res      = await onImport(toImport);
    setResult(res);
    setStep('result');
    setIsImporting(false);
  };

  const inp = "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-pink-400 transition-colors";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-5 py-4 text-white flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
          <div>
            <h3 className="font-bold text-base">Importar clientes desde Excel</h3>
            <p className="text-xs opacity-80 mt-0.5">
              {step === 'upload'  && 'Sube tu archivo .xlsx o .csv'}
              {step === 'preview' && `${validated.length} registros detectados · ${validCount} válidos · ${invalidCount} con errores`}
              {step === 'result'  && 'Importación completada'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-white opacity-70 hover:opacity-100 hover:bg-white hover:bg-opacity-20 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Paso 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Descarga plantilla */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <FileText size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">Paso 1 — Descarga la plantilla</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Usa nuestra plantilla CSV para asegurarte de que las columnas estén correctas.
                    También puedes usar tu propio Excel con las columnas: Nombre, Cedula_RUC, Telefono, Direccion.
                  </p>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-lg flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
                  <Download size={13} />
                  Plantilla
                </button>
              </div>

              {/* Zona de arrastre */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-pink-400 bg-pink-50'
                    : 'border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
                {isParsing ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 size={32} className="animate-spin" style={{ color: '#D61672' }} />
                    <p className="text-sm font-medium">Procesando archivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Upload size={36} className={dragOver ? 'text-pink-500' : ''} />
                    <p className="text-sm font-semibold text-slate-600">Arrastra tu archivo aquí</p>
                    <p className="text-xs">o haz clic para seleccionarlo</p>
                    <p className="text-xs mt-1 text-slate-300">Formatos: .xlsx, .xls, .csv</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Paso 2: Vista previa ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              {/* Resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Total</p>
                  <p className="text-xl font-bold text-slate-700">{validated.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-0.5">Válidos</p>
                  <p className="text-xl font-bold text-green-700">{validCount}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-500 uppercase font-semibold mb-0.5">Con errores</p>
                  <p className="text-xl font-bold text-red-600">{invalidCount}</p>
                </div>
              </div>

              {/* Tabla de vista previa */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">Estado</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Nombre</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">Cédula / RUC</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Teléfono</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Dirección</th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validated.map((row, idx) => (
                        <tr key={idx} className={row.valid ? 'bg-white hover:bg-slate-50' : 'bg-red-50'}>
                          <td className="px-3 py-2">
                            {row.valid
                              ? <CheckCircle size={14} className="text-green-500" />
                              : (
                                <div className="flex flex-col gap-0.5">
                                  <AlertCircle size={14} className="text-red-500" />
                                  {row.errors.map((e, i) => (
                                    <span key={i} className="text-red-500 text-xs leading-tight">{e}</span>
                                  ))}
                                </div>
                              )
                            }
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">{row.name || <span className="text-red-400 italic">vacío</span>}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{row.identification || <span className="text-red-400 italic">vacío</span>}</td>
                          <td className="px-3 py-2 text-slate-500">{row.phone || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{row.address || '—'}</td>
                          <td className="px-3 py-2">
                            <button onClick={() => handleRemoveRow(idx)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                              title="Eliminar fila">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validCount === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    No hay registros válidos para importar. Corrige los errores o descarga la plantilla.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Paso 3: Resultado ── */}
          {step === 'result' && result && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle size={52} className="mx-auto text-green-500" />
              <div>
                <h4 className="text-lg font-bold text-slate-800">¡Importación completada!</h4>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-bold text-green-600">{result.ok}</span> clientes importados correctamente.
                  {result.errors.length > 0 && (
                    <span className="ml-1 text-red-500 font-medium">
                      {result.errors.length} con errores.
                    </span>
                  )}
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="text-left bg-red-50 border border-red-100 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Registros con error:</p>
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-700">
                      <span className="font-semibold">{e.row.name || 'Sin nombre'}</span> — {e.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50 flex gap-2">
          {step === 'upload' && (
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => { setStep('upload'); setRows([]); }}
                className="flex-1 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                ← Volver
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validCount === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
                {isImporting
                  ? <><Loader2 size={14} className="animate-spin" /> Importando...</>
                  : <><Users size={14} /> Importar {validCount} clientes</>
                }
              </button>
            </>
          )}

          {step === 'result' && (
            <button onClick={onClose}
              className="flex-1 py-2.5 text-white font-bold rounded-xl text-sm"
              style={{ background: 'linear-gradient(135deg, #D61672, #FFA901)' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
