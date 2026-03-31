// src/components/TaskPDF.jsx
import { getConfigStore, getEmpresaWhatsApp } from '../lib/configStore.js';

export function generateTaskPDF(task) {
  // Leer configuración de empresa desde el store global
  const cfg = getConfigStore();
  const logoSrc    = cfg.logoUrl || `${window.location.origin}/logo.png`;
  const nombreEmp  = cfg.empresaNombre || 'ACONTPLUS';
  const sloganEmp  = cfg.empresaSlogan || 'Recordatorios';


  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusColor = {
    'Pendiente':  '#d97706',
    'En Proceso': '#2563eb',
    'Completado': '#16a34a',
    'Cancelado':  '#6b7280',
  }[task.status] || '#6b7280';

  const statusBg = {
    'Pendiente':  '#fef3c7',
    'En Proceso': '#dbeafe',
    'Completado': '#dcfce7',
    'Cancelado':  '#f1f5f9',
  }[task.status] || '#f1f5f9';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Datos Tarea - ${task.clientName || '—'}</title>
  <style>
    /* ── Reset ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #1e293b;
      background: #fff;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Página ── */
    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 36px 40px;
    }

    /* ── Encabezado ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 3px solid #D61672;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand img {
      width: 54px;
      height: 54px;
      object-fit: contain;
    }
    .brand-name {
      font-size: 22px;
      font-weight: bold;
      color: #D61672;
      letter-spacing: 0.06em;
    }
    .brand-sub {
      font-size: 11px;
      color: #FFA901;
      font-weight: bold;
      margin-top: 1px;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
      letter-spacing: 0.03em;
    }
    .doc-os {
      font-size: 15px;
      font-weight: bold;
      font-family: monospace;
      color: #D61672;
      margin-top: 4px;
    }
    .doc-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
    }

    /* ── Banner de estado ── */
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 24px;
      border: 1.5px solid;
    }
    .status-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.7;
    }
    .status-value {
      font-size: 15px;
      font-weight: bold;
    }
    .status-divider {
      width: 1px;
      height: 32px;
      background: currentColor;
      opacity: 0.2;
    }
    .status-col {
      text-align: center;
      flex: 1;
    }

    /* ── Secciones ── */
    .section {
      margin-bottom: 22px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #fce7f3;
    }
    .section-icon {
      font-size: 14px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #D61672;
    }

    /* ── Tabla de datos ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
    }
    .data-table td {
      padding: 9px 14px;
      vertical-align: middle;
      font-size: 11px;
      border: 1px solid #f1f5f9;
    }
    .data-table td.lbl {
      background: #fdf2f8;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 10px;
      width: 25%;
      border-color: #fce7f3;
    }
    .data-table td.val {
      color: #1e293b;
      background: #fff;
      font-size: 12px;
    }
    .data-table td.val.mono {
      font-family: monospace;
      font-weight: bold;
      color: #7c3aed;
      font-size: 13px;
    }
    .data-table tr:first-child td:first-child { border-radius: 8px 0 0 0; }
    .data-table tr:last-child  td:last-child  { border-radius: 0 0 8px 0; }

    /* ── Caja de texto ── */
    .text-box {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      min-height: 48px;
      color: #374151;
      font-size: 12px;
      line-height: 1.6;
    }
    .text-box.empty {
      color: #94a3b8;
      font-style: italic;
    }
    .text-box.closure-box {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    /* ── Cierre ── */
    .closure-section {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 22px;
    }
    .closure-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .closure-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #16a34a;
    }
    .closure-table td {
      background: #dcfce7;
      border-color: #bbf7d0;
    }
    .closure-table td.lbl {
      color: #166534;
    }

    /* ── Firmas ── */
    .signature-area {
      display: flex;
      gap: 24px;
      margin-top: 12px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      padding-top: 8px;
      border-top: 1.5px solid #D61672;
      margin-top: 60px;
    }

    /* ── Pie de página ── */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 2px solid #D61672;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .footer-left img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
    .footer-brand {
      font-size: 11px;
      font-weight: bold;
      color: #D61672;
    }
    .footer-sub {
      font-size: 9px;
      color: #FFA901;
      font-weight: bold;
    }
    .footer-right {
      font-size: 10px;
      color: #94a3b8;
      text-align: right;
      line-height: 1.5;
    }

    /* ── Impresión ── */
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 24px 28px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ── ENCABEZADO ── -->
  <div class="header">
    <div class="brand">
      <img src="${logoSrc}" alt="${nombreEmp}" />
      <div>
        <div class="brand-name">${nombreEmp}</div>
        <div class="brand-sub">${sloganEmp}</div>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Datos Tarea</div>
      ${task.serviceOrder
        ? `<div class="doc-os">OS: ${task.serviceOrder}</div>`
        : `<div class="doc-os" style="color:#94a3b8;font-size:12px">Sin orden de servicio</div>`
      }
      <div class="doc-date">Generado: ${formatDate(new Date().toISOString())}</div>
    </div>
  </div>

  <!-- ── BANNER DE ESTADO ── -->
  <div class="status-banner"
    style="background:${statusBg}; border-color:${statusColor}; color:${statusColor}">
    <div class="status-col">
      <div class="status-label">Estado de la tarea</div>
      <div class="status-value" style="color:${statusColor}">${task.status || '—'}</div>
    </div>
    <div class="status-divider"></div>
    <div class="status-col">
      <div class="status-label">Registrado por</div>
      <div class="status-value" style="color:#1e293b;font-size:13px">${task.createdBy || '—'}</div>
    </div>
    <div class="status-divider"></div>
    <div class="status-col">
      <div class="status-label">Fecha de registro</div>
      <div class="status-value" style="color:#1e293b;font-size:12px">${formatDate(task.createdAt)}</div>
    </div>
  </div>

  <!-- ── DATOS DEL CLIENTE ── -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">👤</span>
      <span class="section-title">Datos del cliente</span>
    </div>
    <table class="data-table">
      <tr>
        <td class="lbl">Nombre completo</td>
        <td class="val" colspan="3">${task.clientName || '—'}</td>
      </tr>
      <tr>
        <td class="lbl">Cédula / RUC</td>
        <td class="val" style="font-family:monospace">${task.identification || '—'}</td>
        <td class="lbl">Teléfono</td>
        <td class="val">${task.clientPhone || '—'}</td>
      </tr>
      <tr>
        <td class="lbl">Dirección</td>
        <td class="val" colspan="3">${task.clientAddress || '—'}</td>
      </tr>
    </table>
  </div>

  <!-- ── OBSERVACIONES ── -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">📝</span>
      <span class="section-title">Observaciones</span>
    </div>
    <div class="text-box ${!task.observations ? 'empty' : ''}">
      ${task.observations || 'Sin observaciones registradas'}
    </div>
  </div>

  <!-- ── DATOS DE CIERRE (solo si está completado) ── -->
  ${task.status === 'Completado' && task.completedAt ? `
  <div class="closure-section">
    <div class="closure-header">
      <span style="font-size:16px">✅</span>
      <span class="closure-title">Datos de cierre</span>
    </div>
    <table class="data-table closure-table">
      <tr>
        <td class="lbl" style="background:#dcfce7;border-color:#bbf7d0;color:#166534">Completado por</td>
        <td class="val" style="background:#dcfce7;border-color:#bbf7d0">${task.completedBy || '—'}</td>
        <td class="lbl" style="background:#dcfce7;border-color:#bbf7d0;color:#166534">Fecha de cierre</td>
        <td class="val" style="background:#dcfce7;border-color:#bbf7d0">${formatDate(task.completedAt)}</td>
      </tr>
    </table>
    ${task.completionObservations ? `
    <div style="margin-top:12px">
      <div style="font-size:10px;font-weight:bold;color:#166534;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">
        Observación de cierre
      </div>
      <div class="text-box closure-box">${task.completionObservations}</div>
    </div>` : ''}
  </div>` : ''}

  <!-- ── FIRMAS ── -->
  <div class="section">
    <div class="section-header">
      <span class="section-icon">✍️</span>
      <span class="section-title">Firmas</span>
    </div>
    <div class="signature-area">
      <div class="signature-box">Firma del técnico</div>
      <div class="signature-box">Firma del cliente / Recibí conforme</div>
      <div class="signature-box">Nombre y cédula del cliente</div>
    </div>
  </div>

  <!-- ── PIE DE PÁGINA ── -->
  <div class="footer">
    <div class="footer-left">
      <img src="${logoSrc}" alt="${nombreEmp}" />
      <div>
        <div class="footer-brand">${nombreEmp}</div>
        <div class="footer-sub">${sloganEmp}</div>
      </div>
    </div>
    <div class="footer-right">
      Documento generado el ${formatDate(new Date().toISOString())}<br/>
      ${nombreEmp} · ${sloganEmp}
    </div>
  </div>

</div>
</body>
</html>`;

  return html;
}

export function printTaskPDF(task) {
  const html = generateTaskPDF(task);
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
  w.focus();
}

export function shareViaWhatsApp(task) {
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const cfg         = getConfigStore();
  const empresaNom  = cfg.empresaNombre || 'ACONTPLUS';

  const message = [
    `🔧 *${empresaNom.toUpperCase()}*`,
    `📋 *Datos de Tarea*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    task.serviceOrder ? `🔖 *OS:* ${task.serviceOrder}` : '',
    ``,
    `👤 *CLIENTE*`,
    `• Nombre: ${task.clientName}`,
    task.identification ? `• Cédula/RUC: ${task.identification}` : '',
    task.clientPhone    ? `• Teléfono: ${task.clientPhone}`    : '',
    task.clientAddress  ? `• Dirección: ${task.clientAddress}` : '',
    ``,
    `🔧 *SERVICIO*`,
    `• Estado: ${task.status}`,
    task.observations   ? `\n📝 *Observaciones:*\n${task.observations}` : '',
    task.status === 'Completado' && task.completedAt ? [
      ``,
      `✅ *CIERRE*`,
      `• Completado por: ${task.completedBy}`,
      `• Fecha: ${new Date(task.completedAt).toLocaleDateString('es-EC')}`,
      task.completionObservations ? `• Obs: ${task.completionObservations}` : '',
    ].filter(Boolean).join('\n') : '',
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Enviado desde ${empresaNom}_`,
  ].filter(l => l !== '').join('\n');

  const encoded     = encodeURIComponent(message);
  // Número destino: teléfono del cliente → fallback al número de la empresa
  let destPhone = '';
  if (task.clientPhone) {
    const raw = task.clientPhone.replace(/\D/g, '');
    destPhone = raw.startsWith('0') ? `593${raw.slice(1)}` : `593${raw}`;
  } else {
    destPhone = getEmpresaWhatsApp();
  }
  const url = destPhone
    ? `https://wa.me/${destPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(url, '_blank');
}
