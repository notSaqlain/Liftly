import axios from 'axios';

// Chiave di cache usata nel localStorage — così non bruciamo crediti API inutilmente
const CACHE_KEY = 'liftly_exercises_cache';

// Configurazione base di axios per ExerciseDB su RapidAPI
const apiClient = axios.create({
  baseURL: 'https://exercisedb.p.rapidapi.com',
  headers: {
    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
    'x-rapidapi-key': import.meta.env.VITE_RAPID_API_KEY,
  },
});

/**
 * Recupera tutti gli esercizi disponibili.
 * Prima controlla il localStorage: se i dati ci sono già, li usa direttamente
 * senza fare nessuna chiamata all'API (risparmio di crediti prezioso!).
 */
export const getAllExercises = async () => {
  // Proviamo prima dalla cache locale
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Se il JSON è corrotto, ignoriamo e ricarichiamo dall'API
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // Nessuna cache trovata — scaricamento completo dall'API
  const { data } = await apiClient.get('/exercises', {
    params: { limit: 1300, offset: 0 },
  });

  // Salviamo tutto nel localStorage per le sessioni future
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  return data;
};

/**
 * Recupera la lista delle parti del corpo disponibili.
 * Usata per popolare i chip di filtro in modo dinamico.
 */
export const getBodyPartList = async () => {
  const { data } = await apiClient.get('/exercises/bodyPartList');
  return data;
};

/**
 * Recupera un singolo esercizio tramite il suo ID.
 * Prima controlla se è già presente nella cache locale per evitare
 * una chiamata extra all'API.
 */
export const getExerciseById = async (id) => {
  // Proviamo a trovarlo direttamente nella cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const exercises = JSON.parse(cached);
      const found = exercises.find((ex) => ex.id === id);
      if (found) return found;
    } catch {
      // Cache corrotta, andiamo avanti con la chiamata diretta
    }
  }

  // Fallback: chiamata diretta all'API per questo specifico esercizio
  const { data } = await apiClient.get(`/exercises/exercise/${id}`);
  return data;
};

/**
 * Svuota la cache locale degli esercizi.
 * Utile per forzare un aggiornamento fresco dall'API.
 */
export const clearExerciseCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
