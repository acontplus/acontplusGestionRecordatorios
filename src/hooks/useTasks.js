import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export function useTasks(user) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });
    return () => unsubscribe();
  }, [user]);

  const addTask = async (task) => {
    if (!user) return;
    const taskId = task.id || crypto.randomUUID();
    const taskData = { ...task, id: taskId, createdAt: task.createdAt || new Date().toISOString() };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', taskId), taskData);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const deleteTask = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const markAsCompleted = async (id) => {
    if (!user) return;
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'water_filter_tasks', id), {
        ...taskToUpdate, status: 'Completado'
      });
    } catch (error) {
      console.error("Error al completar:", error);
    }
  };

  return { tasks, addTask, deleteTask, markAsCompleted };
}