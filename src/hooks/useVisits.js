import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export function useVisits(task, user) {
  const [visits, setVisits] = useState(task?.visits || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setVisits(task?.visits || []);
  }, [task]);

  const saveVisits = async (updatedVisits) => {
    await updateDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', task.id),
      { visits: updatedVisits }
    );
    setVisits(updatedVisits);
  };

  const addVisit = async (visitData) => {
    if (!user || !task) return false;
    setIsLoading(true);
    const newVisit = {
      id: crypto.randomUUID(),
      scheduledDate: visitData.scheduledDate,
      scheduledTime: visitData.scheduledTime || '',
      dueDate: visitData.dueDate || '',
      type: visitData.type || '',
      urgency: visitData.urgency || 'Media',
      visitStatus: visitData.visitStatus || 'Pendiente',
      observations: visitData.observations || '',
      technician: visitData.technician || user.email,
      status: 'Programada',
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      completedAt: null,
      completedBy: null,
      closingObservations: '',
    };
    try {
      const updated = [...visits, newVisit];
      await saveVisits(updated);
      return true;
    } catch (error) {
      console.error("Error al agregar visita:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeVisit = async (visitId, closingData) => {
    if (!user || !task) return false;
    setIsLoading(true);
    try {
      const updated = visits.map(v =>
        v.id === visitId ? {
          ...v,
          status: 'Realizada',
          closingObservations: closingData.closingObservations || '',
          completedAt: new Date().toISOString(),
          completedBy: user.email,
        } : v
      );
      await saveVisits(updated);
      return true;
    } catch (error) {
      console.error("Error al completar visita:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelVisit = async (visitId) => {
    if (!user || !task) return false;
    setIsLoading(true);
    try {
      const updated = visits.map(v =>
        v.id === visitId ? { ...v, status: 'Cancelada' } : v
      );
      await saveVisits(updated);
      return true;
    } catch (error) {
      console.error("Error al cancelar visita:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVisit = async (visitId) => {
    if (!user || !task) return false;
    setIsLoading(true);
    try {
      const updated = visits.filter(v => v.id !== visitId);
      await saveVisits(updated);
      return true;
    } catch (error) {
      console.error("Error al eliminar visita:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { visits, isLoading, addVisit, completeVisit, cancelVisit, deleteVisit };
}