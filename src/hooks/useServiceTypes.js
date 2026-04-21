import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export function useServiceTypes(user) {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoading, setIsLoading]       = useState(false);

  useEffect(() => {
    if (!user) return;
    const colRef    = collection(db, 'artifacts', appId, 'public', 'data', 'service_types');
    const unsub     = onSnapshot(colRef, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setServiceTypes(data);
    });
    return () => unsub();
  }, [user]);

  const addServiceType = async ({ name, description }) => {
    if (!user || !name?.trim()) return false;
    setIsLoading(true);
    try {
      const id  = crypto.randomUUID();
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'service_types', id),
        {
          id,
          name:        name.trim(),
          description: description?.trim() || '',
          createdAt:   new Date().toISOString(),
          createdBy:   user.email,
        }
      );
      return true;
    } catch (err) {
      console.error('Error al guardar tipo:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateServiceType = async (id, { name, description }) => {
    if (!user || !name?.trim()) return false;
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'service_types', id),
        { id, name: name.trim(), description: description?.trim() || '', updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Error al actualizar tipo:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteServiceType = async (id) => {
    if (!user) return false;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'service_types', id));
      return true;
    } catch (err) {
      console.error('Error al eliminar tipo:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { serviceTypes, isLoading, addServiceType, updateServiceType, deleteServiceType };
}
