// src/hooks/useTiposVisita.js
import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

// Tipos predeterminados que se usan como fallback si no hay datos en Firestore
export const TIPOS_VISITA_DEFAULT = [
  'Mantenimiento preventivo',
  'Mantenimiento correctivo',
  'Instalación',
  'Revisión técnica',
  'Cambio de filtros',
  'Limpieza de equipo',
  'Inspección',
  'Otro',
];

export function useTiposVisita(user) {
  const [tipos, setTipos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'tipos_visita');
    const unsub = onSnapshot(colRef, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setTipos(data);
    });
    return () => unsub();
  }, [user]);

  const addTipo = async (nombre) => {
    if (!user || !nombre.trim()) return false;
    setIsLoading(true);
    const id = crypto.randomUUID();
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'tipos_visita', id),
        { id, nombre: nombre.trim(), createdAt: new Date().toISOString() }
      );
      return true;
    } catch (e) {
      console.error('Error al agregar tipo de visita:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTipo = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tipos_visita', id));
    } catch (e) {
      console.error('Error al eliminar tipo de visita:', e);
    }
  };

  // Lista para usar en selects: si hay datos en Firestore los usa, si no, usa los predeterminados
  const tiposParaSelect = tipos.length > 0
    ? tipos.map(t => t.nombre)
    : TIPOS_VISITA_DEFAULT;

  return { tipos, tiposParaSelect, isLoading, addTipo, deleteTipo };
}
