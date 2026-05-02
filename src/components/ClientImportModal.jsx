import { useState, useRef } from 'react';
import {
  X, Upload, Download, CheckCircle, AlertCircle,
  Loader2, FileText, Trash2, Users
} from 'lucide-react';

// ─── Plantilla de descarga ─────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = ['Nombre', 'Cedula_RUC', 'Telefono', 'Direccion', 'Extranjero'];
  const example = [
    ['Juan Pérez', '1712345678', '0991234567', 'Av. Principal 123', 'NO'],
    ['Empresa ABC S.A.', '1790123456001', '022345678', 'Calle 5 de Junio 456', 'NO'],
    ['John Smith', 'A1234567', '0998765432', 'Edificio Centro', 'SI'],
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

// ─── Validación completa por fila ─────────────────────────────────────────────
function validateRow(row, existingIds, seenInFile, rowIndex) {
  const errors = [];

  // 1. Nombre vacío
  if (!row.name?.trim())
    errors.push('Nombre vacío');

  // 2. Cédula/RUC vacía
  if (!row.identification?.trim()) {
    errors.push('Cédula/RUC o pasaporte vacío');
  } else {
    const clean = row.identification.replace(/\s/g, '');

    if (!row.foreign) {
      // 3. Solo números para nacionales
      if (!/^\d+$/.test(clean))
        errors.push('Solo se permiten números para clientes nacionales');
      // 4. Longitud 10 o 13 para nacionales
      else if (clean.length !== 10 && clean.length !== 13)
        errors.push(`Longitud inválida: tiene ${clean.length} dígito${clean.length !== 1 ? 's' : ''} (debe ser 10 o 13)`);
    }

    // 5. Duplicado dentro del archivo
    if (seenInFile.has(clean)) {
      const prevRow = seenInFile.get(clean);
      errors.push(`Cédula/RUC repetida en el archivo (igual a fila ${prevRow})`);
    } else if (clean) {
      seenInFile.set(clean, rowIndex);
    }

    // 6. Duplicado vs sistema (advertencia, no bloquea)
    if (existingIds.has(clean) && errors.length === 0)
      errors.push('⚠️ Ya existe en el sistema (se sobreescribirá)');
  }

  return errors;
}
// ─── Mapear encabezados flexibles a campos internos ──────────────────────────
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

  // Detectar extranjero: SI, S, YES, 1, TRUE → true
  const foreignRaw = get('extranjero', 'foreign', 'isforeignclient', 'esextranjero').toUpperCase();
  const foreign = ['SI', 'S', 'YES', '1', 'TRUE', 'SÍ'].includes(foreignRaw);

  return {
    name:           get('nombre', 'name', 'cliente', 'razonsocial'),
    identification: get('cedularuc', 'cedula', 'ruc', 'identification', 'id', 'pasaporte', 'passport'),
    phone:          get('telefono', 'phone', 'celular', 'movil'),
    address:        get('direccion', 'address', 'domicilio'),
    foreign,
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

  // Validar filas con todos los checks: nombre, cédula, longitud, duplicados
  const seenInFile = new Map();
  const validated = rows.map((row, idx) => {
    const errors = validateRow(row, existingIds, seenInFile, idx + 1);
    // Filas con solo el aviso de "ya existe" se marcan como válidas (se sobreescribe)
    const hasBlockingError = errors.some(e => !e.startsWith('⚠️'));
    return { ...row, errors, valid: !hasBlockingError };
  });

  const validCount   = validated.filter(r => r.valid).length;
  const invalidCount = validated.length - validCount;

  // Agrupar errores por tipo para el panel de alertas
  const errorGroups = {
    nombreVacio:     validated.map((r,i) => r.errors.some(e => e.includes('Nombre vacío'))            ? i+1 : null).filter(Boolean),
    cedulaVacia:     validated.map((r,i) => r.errors.some(e => e.includes('vacío') && !e.includes('Nombre')) ? i+1 : null).filter(Boolean),
    longitud:        validated.map((r,i) => r.errors.some(e => e.includes('Longitud') || e.includes('dígito')) ? i+1 : null).filter(Boolean),
    soloNumeros:     validated.map((r,i) => r.errors.some(e => e.includes('Solo se permiten números'))        ? i+1 : null).filter(Boolean),
    duplicadoArchivo:validated.map((r,i) => r.errors.some(e => e.includes('repetida en el archivo'))          ? i+1 : null).filter(Boolean),
    duplicadoSistema:validated.map((r,i) => r.errors.some(e => e.includes('Ya existe en el sistema'))         ? i+1 : null).filter(Boolean),
  };

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

              {/* Panel de alertas agrupadas */}
              {invalidCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    {invalidCount} fila{invalidCount !== 1 ? 's' : ''} con errores que no se importarán
                  </p>
                  {errorGroups.nombreVacio.length > 0 && (
                    <p className="text-xs text-red-700">
                      <span className="font-bold">Nombre vacío</span>
                      <span className="text-red-500"> → fila{errorGroups.nombreVacio.length > 1 ? 's' : ''} {errorGroups.nombreVacio.join(', ')}</span>
                    </p>
                  )}
                  {errorGroups.cedulaVacia.length > 0 && (
                    <p className="text-xs text-red-700">
                      <span className="font-bold">Cédula/RUC vacío</span>
                      <span className="text-red-500"> → fila{errorGroups.cedulaVacia.length > 1 ? 's' : ''} {errorGroups.cedulaVacia.join(', ')}</span>
                    </p>
                  )}
                  {errorGroups.soloNumeros.length > 0 && (
                    <p className="text-xs text-red-700">
                      <span className="font-bold">Contiene letras (cliente nacional)</span>
                      <span className="text-red-500"> → fila{errorGroups.soloNumeros.length > 1 ? 's' : ''} {errorGroups.soloNumeros.join(', ')} — pon Extranjero=SI en el archivo</span>
                    </p>
                  )}
                  {errorGroups.longitud.length > 0 && (
                    <p className="text-xs text-red-700">
                      <span className="font-bold">Longitud inválida (debe ser 10 o 13 dígitos)</span>
                      <span className="text-red-500"> → fila{errorGroups.longitud.length > 1 ? 's' : ''} {errorGroups.longitud.join(', ')}</span>
                    </p>
                  )}
                  {errorGroups.duplicadoArchivo.length > 0 && (
                    <p className="text-xs text-red-700">
                      <span className="font-bold">Cédula/RUC repetida en el archivo</span>
                      <span className="text-red-500"> → fila{errorGroups.duplicadoArchivo.length > 1 ? 's' : ''} {errorGroups.duplicadoArchivo.join(', ')}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Aviso sobreescritura */}
              {errorGroups.duplicadoSistema.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 mb-0.5">
                    ⚠️ {errorGroups.duplicadoSistema.length} cliente{errorGroups.duplicadoSistema.length > 1 ? 's' : ''} ya exist{errorGroups.duplicadoSistema.length > 1 ? 'en' : 'e'} en el sistema
                  </p>
                  <p className="text-xs text-amber-600">
                    Fila{errorGroups.duplicadoSistema.length > 1 ? 's' : ''} {errorGroups.duplicadoSistema.join(', ')} — se sobreescribirán con los datos del archivo.
                  </p>
                </div>
              )}

              {/* Tabla de vista previa */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">Estado</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Nombre</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">Cédula / RUC / Pasaporte</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Teléfono</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Dirección</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">Tipo</th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validated.map((row, idx) => (
                        <tr key={idx} className={
                          !row.valid
                            ? 'bg-red-50'
                            : row.errors.some(e => e.startsWith('⚠️'))
                              ? 'bg-amber-50'
                              : 'bg-white hover:bg-slate-50'
                        }>
                          <td className="px-3 py-2 text-slate-400 font-mono font-bold">{idx + 1}</td>
                          <td className="px-3 py-2">
                            {row.valid && !row.errors.some(e => e.startsWith('⚠️'))
                              ? <CheckCircle size={14} className="text-green-500" />
                              : (
                                <div className="flex flex-col gap-0.5">
                                  {!row.valid && <AlertCircle size={14} className="text-red-500" />}
                                  {row.errors.filter(e => !e.startsWith('⚠️')).map((e, i) => (
                                    <span key={i} className="text-red-600 text-xs leading-tight font-medium">{e}</span>
                                  ))}
                                  {row.errors.filter(e => e.startsWith('⚠️')).map((e, i) => (
                                    <span key={i} className="text-amber-600 text-xs leading-tight">{e}</span>
                                  ))}
                                </div>
                              )
                            }
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {row.name || <span className="text-red-400 italic">vacío</span>}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">
                            {row.identification || <span className="text-red-400 italic">vacío</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{row.phone || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{row.address || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.foreign
                              ? <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">🌐 Extranjero</span>
                              : <span className="text-slate-400 text-xs">Nacional</span>
                            }
                          </td>
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
