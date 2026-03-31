// src/lib/configStore.js
// Módulo singleton — guarda la configuración de empresa en memoria
// para que TaskPDF y otros módulos puros puedan accederla sin props.

let _config = {
  empresaNombre:   'ACONTPLUS',
  empresaSlogan:   'Recordatorios',
  empresaTag:      'Facturar nunca fue tan fácil',
  whatsappNumero:  '',
  whatsappPrefijo: '593',
  logoUrl:         '',
};

/** Actualiza el store con los datos de Firestore */
export function setConfigStore(config) {
  if (!config) return;
  _config = {
    empresaNombre:   config.empresaNombre   || 'ACONTPLUS',
    empresaSlogan:   config.empresaSlogan   || 'Recordatorios',
    empresaTag:      config.empresaTag      || 'Facturar nunca fue tan fácil',
    whatsappNumero:  config.whatsappNumero  || '',
    whatsappPrefijo: config.whatsappPrefijo || '593',
    logoUrl:         config.logoUrl         || '',
  };
}

/** Lee la configuración actual */
export function getConfigStore() {
  return { ..._config };
}

/** Número de WhatsApp de la empresa formateado para wa.me */
export function getEmpresaWhatsApp() {
  const { whatsappNumero, whatsappPrefijo } = _config;
  if (!whatsappNumero) return '';
  const raw = whatsappNumero.replace(/\D/g, '');
  const num = raw.startsWith('0') ? raw.slice(1) : raw;
  return `${whatsappPrefijo}${num}`;
}
