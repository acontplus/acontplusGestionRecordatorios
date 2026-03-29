import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';

export function useClients(user) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'clients');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClients(data);
    });
    return () => unsubscribe();
  }, [user]);

  const saveClient = async (clientData) => {
    if (!user) return null;
    // ✅ CORREGIDO: protección contra identification undefined o vacío
    if (!clientData.identification || !clientData.identification.trim()) return null;

    const clientId = clientData.identification.replace(/\s/g, '');
    const client = {
      id: clientId,
      name: clientData.clientName,
      phone: clientData.clientPhone || '',
      address: clientData.clientAddress || '',
      identification: clientData.identification,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId),
        client,
        { merge: true }
      );
      return client;
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      return null;
    }
  };

  return { clients, saveClient };
}