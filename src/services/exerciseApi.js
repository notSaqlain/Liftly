// URL base per i file raw del repository GitHub
const GITHUB_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';
const EXERCISES_URL = `${GITHUB_BASE}/data/exercises.json`;

// Cache in memoria per la sessione corrente (non localStorage — nessun problema di ToS)
let exercisesCache = null;

/**
 * Converte un record dal formato del dataset GitHub
 * al formato usato internamente dall'app.
 * Mantiene compatibilità con i componenti esistenti.
 */
const normalizeExercise = (ex) => {
  // Le istruzioni nel dataset sono una stringa unica → le dividiamo in passi
  const rawInstructions = ex.instructions?.en || '';
  const steps = rawInstructions
    .split(/\.\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => (s.endsWith('.') ? s : `${s}.`));

  return {
    id: ex.id,
    name: ex.name,
    bodyPart: ex.body_part || ex.category || '',
    category: ex.category || '',
    equipment: ex.equipment || '',
    target: ex.target || '',
    muscleGroup: ex.muscle_group || '',
    secondaryMuscles: Array.isArray(ex.secondary_muscles) ? ex.secondary_muscles : [],
    instructions: steps,
    // URL completi per GIF e immagine statica (pubblici, nessuna autenticazione richiesta)
    gifUrl: ex.gif_url ? `${GITHUB_BASE}/${ex.gif_url}` : null,
    imageUrl: ex.image ? `${GITHUB_BASE}/${ex.image}` : null,
  };
};

/**
 * Recupera tutti gli esercizi dal dataset GitHub.
 * Usa una cache in memoria per evitare download ripetuti nella stessa sessione.
 */
export const getAllExercises = async () => {
  if (exercisesCache) return exercisesCache;

  const response = await fetch(EXERCISES_URL);
  if (!response.ok) {
    throw new Error(`Impossibile caricare il dataset: ${response.status}`);
  }

  const data = await response.json();
  exercisesCache = data.map(normalizeExercise);
  return exercisesCache;
};

/**
 * Recupera la lista delle parti del corpo uniche.
 * Usata per popolare i chip di filtro nella schermata Workout.
 */
export const getBodyPartList = async () => {
  const exercises = await getAllExercises();
  const parts = [...new Set(exercises.map(ex => ex.bodyPart))]
    .filter(Boolean)
    .sort();
  return parts;
};

/**
 * Recupera un singolo esercizio tramite il suo ID.
 * Sfrutta la cache in memoria per non riscaricare tutto il dataset.
 */
export const getExerciseById = async (id) => {
  const exercises = await getAllExercises();
  return exercises.find(ex => ex.id === id) ?? null;
};
