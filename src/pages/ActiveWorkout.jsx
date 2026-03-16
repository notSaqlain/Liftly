import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import exercisesData from '../data/exercises.json';
import { ChevronLeft, Plus, Minus, Check, Dumbbell, Trophy, Timer } from 'lucide-react';

const ActiveWorkout = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayName = searchParams.get('day') || 'Workout';
  
  const dayExerciseIds = useMemo(() => {
    return userData?.customRoutines?.[dayName] || [];
  }, [userData, dayName]);

  const exercises = useMemo(() => {
    return dayExerciseIds.map(id => exercisesData.find(e => e.id === id)).filter(Boolean);
  }, [dayExerciseIds]);

  // State for tracking sets: { exerciseId: [{ weight: '', reps: '', done: false }] }
  const [workoutLog, setWorkoutLog] = useState(() => {
    const initial = {};
    exercises.forEach(ex => {
      initial[ex.id] = [{ weight: '', reps: '', done: false }];
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  const addSet = (exerciseId) => {
    setWorkoutLog(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { weight: '', reps: '', done: false }]
    }));
  };

  const removeSet = (exerciseId) => {
    setWorkoutLog(prev => {
      const sets = prev[exerciseId] || [];
      if (sets.length <= 1) return prev;
      return { ...prev, [exerciseId]: sets.slice(0, -1) };
    });
  };

  const updateSet = (exerciseId, setIdx, field, value) => {
    setWorkoutLog(prev => {
      const sets = [...(prev[exerciseId] || [])];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  };

  const toggleSetDone = (exerciseId, setIdx) => {
    setWorkoutLog(prev => {
      const sets = [...(prev[exerciseId] || [])];
      sets[setIdx] = { ...sets[setIdx], done: !sets[setIdx].done };
      return { ...prev, [exerciseId]: sets };
    });
  };

  const totalSets = Object.values(workoutLog).reduce((sum, sets) => sum + sets.filter(s => s.done).length, 0);
  const totalVolume = Object.values(workoutLog).reduce((sum, sets) => {
    return sum + sets.filter(s => s.done).reduce((acc, set) => {
      return acc + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0));
    }, 0);
  }, 0);

  const handleFinishWorkout = async () => {
    if (!currentUser) return;
    setSaving(true);

    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    
    // Build workout data
    const workoutData = {
      userId: currentUser.uid,
      day: dayName,
      exercises: Object.entries(workoutLog)
        .filter(([_, sets]) => sets.some(s => s.done))
        .map(([exerciseId, sets]) => {
          const ex = exercisesData.find(e => e.id === exerciseId);
          return {
            exerciseId,
            name: ex?.name || exerciseId,
            muscleGroup: ex?.muscleGroup || 'Unknown',
            sets: sets.filter(s => s.done).map(s => ({
              weight: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps) || 0,
            }))
          };
        }),
      totalSets,
      totalVolume: Math.round(totalVolume),
      durationMinutes,
      completedAt: serverTimestamp()
    };

    try {
      // Save workout to subcollection
      await addDoc(collection(db, 'users', currentUser.uid, 'user_workouts'), workoutData);
      // Increment streak
      await updateDoc(doc(db, 'users', currentUser.uid), {
        currentStreak: increment(1),
        lastWorkoutDate: serverTimestamp()
      });
      setFinished(true);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Completion screen
  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-black text-liftly-navy mb-2">Workout Complete!</h1>
        <p className="text-slate-500 mb-8">Great work on your {dayName} session.</p>
        
        <div className="flex gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-liftly-navy">{totalSets}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sets</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-liftly-navy">{Math.round(totalVolume).toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Volume (kg)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[100px]">
            <p className="text-2xl font-bold text-liftly-navy">{Math.round((Date.now() - startTime) / 60000)}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Minutes</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full max-w-xs h-14 bg-liftly-navy text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-liftly-navy">{dayName}</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{exercises.length} exercises</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
            <Timer size={14} className="text-slate-400" />
            <ElapsedTime startTime={startTime} />
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
        {exercises.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-200 shadow-sm mt-8">
            <Dumbbell className="mx-auto text-slate-300 w-12 h-12 mb-3" />
            <h3 className="font-bold text-lg text-slate-800 mb-2">No exercises for {dayName}</h3>
            <p className="text-slate-500 text-sm">Go to the Workout tab to add exercises to this day.</p>
            <button onClick={() => navigate('/workout')} className="mt-4 px-6 py-2 bg-liftly-teal text-white font-bold text-sm rounded-xl active:scale-95 transition-all">
              Browse Exercises
            </button>
          </div>
        ) : (
          exercises.map(exercise => {
            const sets = workoutLog[exercise.id] || [{ weight: '', reps: '', done: false }];
            return (
              <div key={exercise.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Exercise Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 text-liftly-teal flex items-center justify-center shrink-0">
                    <Dumbbell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{exercise.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{exercise.muscleGroup}</p>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="p-3">
                  <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 mb-2 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 text-center">Set</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 text-center">Weight (kg)</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 text-center">Reps</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 text-center">✓</span>
                  </div>
                  
                  {sets.map((set, idx) => (
                    <div key={idx} className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center py-1 ${set.done ? 'opacity-60' : ''}`}>
                      <span className="text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) => updateSet(exercise.id, idx, 'weight', e.target.value)}
                        className="h-10 bg-slate-50 text-center font-bold text-sm text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal"
                      />
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.id, idx, 'reps', e.target.value)}
                        className="h-10 bg-slate-50 text-center font-bold text-sm text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal"
                      />
                      <button
                        onClick={() => toggleSetDone(exercise.id, idx)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                          set.done 
                            ? 'bg-green-500 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Add/Remove Set */}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => addSet(exercise.id)} className="flex-1 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95">
                      <Plus size={14} /> Add Set
                    </button>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(exercise.id)} className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-500 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95">
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Finish Button */}
      {exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-30">
          <div className="max-w-[480px] mx-auto">
            <button 
              onClick={handleFinishWorkout}
              disabled={saving || totalSets === 0}
              className="w-full h-14 bg-liftly-teal text-white font-bold text-lg rounded-2xl shadow-[0_4px_20px_0_rgba(0,173,181,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trophy size={20} />
                  Finish Workout ({totalSets} sets)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Live elapsed timer component
const ElapsedTime = ({ startTime }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span className="text-xs font-bold text-slate-500 tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>;
};

export default ActiveWorkout;
