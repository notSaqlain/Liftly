import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExerciseById } from '../services/exerciseApi';
import { ChevronLeft, Dumbbell, Target, Zap, ListOrdered, BookOpen } from 'lucide-react';
import ExerciseGif from '../components/ExerciseGif';

// Mappa i colori e le icone in base alla parte del corpo
const getBodyPartTheme = (part = '') => {
  const p = part.toLowerCase();
  if (p.includes('chest')) return { gradient: 'from-red-500/30 to-red-900/10', accent: '#f87171', ring: 'border-red-500/20', badge: 'bg-red-500/20 text-red-300 border-red-500/30', emoji: '💪' };
  if (p.includes('back') || p.includes('lat')) return { gradient: 'from-blue-500/30 to-blue-900/10', accent: '#60a5fa', ring: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', emoji: '🔙' };
  if (p.includes('leg') || p.includes('quad') || p.includes('glute') || p.includes('hamstr') || p.includes('calf')) return { gradient: 'from-green-500/30 to-green-900/10', accent: '#4ade80', ring: 'border-green-500/20', badge: 'bg-green-500/20 text-green-300 border-green-500/30', emoji: '🦵' };
  if (p.includes('shoulder')) return { gradient: 'from-purple-500/30 to-purple-900/10', accent: '#c084fc', ring: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', emoji: '🏋️' };
  if (p.includes('upper arm') || p.includes('forearm')) return { gradient: 'from-orange-500/30 to-orange-900/10', accent: '#fb923c', ring: 'border-orange-500/20', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', emoji: '💪' };
  if (p.includes('waist') || p.includes('core') || p.includes('abs')) return { gradient: 'from-yellow-500/30 to-yellow-900/10', accent: '#facc15', ring: 'border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', emoji: '🔥' };
  if (p.includes('cardio')) return { gradient: 'from-pink-500/30 to-pink-900/10', accent: '#f472b6', ring: 'border-pink-500/20', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30', emoji: '❤️' };
  return { gradient: 'from-slate-500/30 to-slate-900/10', accent: '#94a3b8', ring: 'border-slate-500/20', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', emoji: '🏋️' };
};


const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
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
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-[#00d4aa] text-[#0a0e1a] font-black rounded-2xl active:scale-95 transition-all">
          Torna indietro
        </button>
      </div>
    );
  }

  const theme = getBodyPartTheme(exercise.bodyPart);

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
          <h1 className="text-lg font-black text-white leading-tight capitalize truncate">{exercise.name}</h1>
          <p className="text-xs text-slate-400 font-semibold capitalize">{exercise.bodyPart}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">

        {/* GIF animata (con fallback alla card CSS se non disponibile) */}
        <ExerciseGif gifUrl={exercise.gifUrl} theme={theme} />

        {/* Badge: muscolo target + attrezzatura + parte del corpo */}
        <div className="flex flex-wrap gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${theme.badge}`}>
            <Target size={12} />
            <span className="text-xs font-black uppercase tracking-wider">{exercise.target}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white/5 border-white/10">
            <Dumbbell size={12} className="text-slate-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 capitalize">{exercise.equipment}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${theme.badge}`}>
            <Zap size={12} />
            <span className="text-xs font-black uppercase tracking-wider capitalize">{exercise.bodyPart}</span>
          </div>
        </div>

        {/* Muscolo primario sinergista — mostrato solo se presente */}
        {exercise.muscleGroup && (
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: `${theme.accent}22` }}>
                <BookOpen size={14} style={{ color: theme.accent }} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Muscolo primario</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed capitalize">{exercise.muscleGroup}</p>
          </div>
        )}

        {/* Muscoli secondari */}
        {exercise.secondaryMuscles?.length > 0 && (
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Muscoli secondari</p>
            <div className="flex flex-wrap gap-2">
              {exercise.secondaryMuscles.map((muscle, i) => (
                <span key={i} className="px-2.5 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-300 capitalize border border-white/10">
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Come eseguirlo</p>
            </div>
            <div className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-[#00d4aa]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
};

export default ExerciseDetail;
