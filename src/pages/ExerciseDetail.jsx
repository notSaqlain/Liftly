import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExerciseById } from '../services/exerciseApi';
import { ChevronLeft, Dumbbell, Target, Zap, ListOrdered } from 'lucide-react';

// Mappa i colori in base alla parte del corpo — stessa logica di Workout.jsx
const getBodyPartColor = (part = '') => {
  const p = part.toLowerCase();
  if (p.includes('chest')) return { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' };
  if (p.includes('back') || p.includes('lat')) return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' };
  if (p.includes('leg') || p.includes('quad') || p.includes('glute') || p.includes('hamstr') || p.includes('calf')) return { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30' };
  if (p.includes('shoulder')) return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' };
  if (p.includes('upper arm') || p.includes('bicep') || p.includes('tricep') || p.includes('forearm')) return { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' };
  if (p.includes('waist') || p.includes('core') || p.includes('abs')) return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' };
  if (p.includes('cardio')) return { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' };
  return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' };
};

const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Carica i dati dell'esercizio all'avvio della pagina
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true);
        const data = await getExerciseById(id);
        setExercise(data);
      } catch (err) {
        console.error('Errore nel caricamento dell\'esercizio:', err);
        setError('Impossibile caricare i dettagli di questo esercizio.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  // Schermata di caricamento
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#0a0e1a] items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-3xl bg-[#1a2540] flex items-center justify-center animate-pulse">
          <Dumbbell size={24} className="text-[#00d4aa]" />
        </div>
        <p className="text-slate-400 text-sm font-semibold">Caricamento esercizio…</p>
      </div>
    );
  }

  // Schermata di errore
  if (error || !exercise) {
    return (
      <div className="flex flex-col h-full bg-[#0a0e1a] items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 rounded-3xl bg-red-500/10 flex items-center justify-center">
          <Dumbbell size={24} className="text-red-400" />
        </div>
        <p className="text-white font-bold text-center">{error || 'Esercizio non trovato'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-[#00d4aa] text-[#0a0e1a] font-black rounded-2xl active:scale-95 transition-all"
        >
          Torna indietro
        </button>
      </div>
    );
  }

  const bodyPartColor = getBodyPartColor(exercise.bodyPart);
  const targetColor = getBodyPartColor(exercise.target);

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a] overflow-y-auto no-scrollbar">

      {/* Header con pulsante indietro */}
      <div className="sticky top-0 z-20 bg-[#0a0e1a]/95 backdrop-blur-md border-b border-white/5 px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-white leading-tight capitalize truncate">
            {exercise.name}
          </h1>
          <p className="text-xs text-slate-400 font-semibold capitalize">{exercise.bodyPart}</p>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 p-5 space-y-5">

        {/* GIF animata dell'esercizio */}
        <div className="w-full rounded-3xl overflow-hidden bg-[#111827] border border-white/5 flex items-center justify-center aspect-square max-w-sm mx-auto relative">
          {/* Placeholder visibile mentre la GIF carica */}
          {!gifLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center animate-pulse">
                <Dumbbell size={22} className="text-[#00d4aa]" />
              </div>
            </div>
          )}
          <img
            src={exercise.gifUrl}
            alt={`Dimostrazione di ${exercise.name}`}
            className={`w-full h-full object-contain transition-opacity duration-500 ${gifLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setGifLoaded(true)}
          />
        </div>

        {/* Badge: muscolo target + attrezzatura */}
        <div className="flex flex-wrap gap-2">
          {/* Muscolo target primario */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${targetColor.bg} ${targetColor.border}`}>
            <Target size={12} className={targetColor.text} />
            <span className={`text-xs font-black uppercase tracking-wider ${targetColor.text}`}>
              {exercise.target}
            </span>
          </div>

          {/* Attrezzatura necessaria */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white/5 border-white/10">
            <Dumbbell size={12} className="text-slate-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 capitalize">
              {exercise.equipment}
            </span>
          </div>

          {/* Parte del corpo */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${bodyPartColor.bg} ${bodyPartColor.border}`}>
            <Zap size={12} className={bodyPartColor.text} />
            <span className={`text-xs font-black uppercase tracking-wider ${bodyPartColor.text}`}>
              {exercise.bodyPart}
            </span>
          </div>
        </div>

        {/* Muscoli secondari — mostrati solo se presenti */}
        {exercise.secondaryMuscles?.length > 0 && (
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Muscoli secondari coinvolti
            </p>
            <div className="flex flex-wrap gap-2">
              {exercise.secondaryMuscles.map((muscle, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-300 capitalize border border-white/10"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Istruzioni passo-passo */}
        {exercise.instructions?.length > 0 && (
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center">
                <ListOrdered size={14} className="text-[#00d4aa]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Come eseguirlo
              </p>
            </div>
            <div className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {/* Numero del passo */}
                  <div className="w-6 h-6 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-[#00d4aa]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spazio extra in fondo per evitare che il contenuto finisca troppo vicino al bordo */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default ExerciseDetail;
