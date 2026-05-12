import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

// Mappa delle azioni e dei punti corrispondenti
export const POINTS_MAP = {
  WORKOUT_COMPLETED: 50,
  CHALLENGE_COMPLETED: 100,
  // Aggiungi altre azioni qui in futuro
};

/**
 * Calcola gli aggiornamenti dei punti da applicare al documento utente.
 * Utile per unire gli aggiornamenti in una singola chiamata Firestore (es. in ActiveWorkout).
 * 
 * @param {Object} userData - I dati attuali dell'utente
 * @param {string} actionType - Tipo di azione (chiave di POINTS_MAP)
 * @param {boolean} dailyCap - Se true, i punti vengono assegnati solo una volta al giorno
 * @returns {Object} Oggetto con i campi da aggiornare, o oggetto vuoto se limite raggiunto
 */
export const getPointsUpdate = (userData, actionType, dailyCap = false) => {
  const pointsToAdd = POINTS_MAP[actionType] || 0;
  if (pointsToAdd === 0) return {};

  if (dailyCap) {
    // Usiamo toLocaleDateString('en-CA') per ottenere YYYY-MM-DD nel fuso orario locale
    const today = new Date().toLocaleDateString('en-CA');
    const lastActionDate = userData?.[`last_${actionType}_Date`];
    
    if (lastActionDate === today) {
      // Punti già assegnati oggi per questa azione
      return {};
    }
    
    return {
      points: increment(pointsToAdd),
      [`last_${actionType}_Date`]: today
    };
  }

  return { points: increment(pointsToAdd) };
};

/**
 * Aggiunge punti all'utente in modo indipendente.
 * 
 * @param {string} userId - ID dell'utente
 * @param {string} actionType - Tipo di azione (chiave di POINTS_MAP)
 * @param {boolean} dailyCap - Se true, i punti vengono assegnati solo una volta al giorno
 */
export const awardPoints = async (userId, actionType, dailyCap = false) => {
  if (!userId || !POINTS_MAP[actionType]) return { success: false, message: 'Azione o utente non validi.' };

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) return { success: false, message: 'Utente non trovato.' };

  const userData = userDoc.data();
  const updates = getPointsUpdate(userData, actionType, dailyCap);

  if (Object.keys(updates).length === 0) {
    return { success: false, message: 'Limite giornaliero raggiunto per questa azione.' };
  }

  await updateDoc(userRef, updates);
  
  return { success: true, pointsAdded: POINTS_MAP[actionType] };
};
