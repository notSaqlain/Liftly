import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import exercisesData from '../data/exercises.json';
import { ChevronLeft, Plus, Minus, Check, Dumbbell, Trophy, Timer, Pause, Play, RotateCcw } from 'lucide-react';

const REST_PRESETS = [60, 90, 120, 180]; // seconds

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

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTarget, setRestTarget] = useState(90); // default 90s
  const [restRunning, setRestRunning] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Rest timer countdown
  useEffect(() => {
    if (!restRunning || restSeconds <= 0) return;
    const id = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          setRestRunning(false);
          // Vibrate on finish if available
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning, restSeconds]);

  const startRest = useCallback((seconds) => {
    setRestTarget(seconds);
    setRestSeconds(seconds);
    setRestRunning(true);
    setShowRestTimer(true);
  }, []);

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
      const wasDone = sets[setIdx].done;
      sets[setIdx] = { ...sets[setIdx], done: !wasDone };

      // Auto-add a new set when marking the last set as done
      if (!wasDone && setIdx === sets.length - 1) {
        sets.push({ weight: sets[setIdx].weight, reps: '', done: false });
      }

      return { ...prev, [exerciseId]: sets };
    });
    // Auto-start rest timer when marking a set as done
    const sets = workoutLog[exerciseId] || [];
    if (!sets[setIdx]?.done) {
      startRest(restTarget);
    }
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
      await addDoc(collection(db, 'users', currentUser.uid, 'user_workouts'), workoutData);
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

  // ── Completion Screen ──
  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          <Trophy size={40} />
        </div>
        <h1 className="text-3xl font-black text-liftly-navy mb-2">Workout Complete!</h1>
        <p className="text-slate-500 mb-8">Great work on your {dayName} session.</p>
        
        <div className="flex gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-liftly-navy">{totalSets}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sets</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-liftly-navy">{Math.round(totalVolume).toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Volume (kg)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center min-w-[90px]">
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

  // ── Main Workout Screen ──
  const restProgress = restTarget > 0 ? ((restTarget - restSeconds) / restTarget) * 100 : 0;
  const restMins = Math.floor(restSeconds / 60);
  const restSecs = restSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black text-liftly-navy leading-tight">{dayName}</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{exercises.length} exercises</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
          <Timer size={13} className="text-slate-400" />
          <ElapsedTime startTime={startTime} />
        </div>
      </div>

      {/* Rest Timer Banner */}
      {showRestTimer && (
        <div className={`mx-4 mt-3 rounded-2xl overflow-hidden border shadow-sm transition-all ${restSeconds === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={16} className={restSeconds === 0 ? 'text-green-500' : 'text-orange-500'} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {restSeconds === 0 ? 'Rest Complete!' : 'Rest Timer'}
                </span>
              </div>
              <button 
                onClick={() => setShowRestTimer(false)} 
                className="text-slate-400 text-xs font-bold hover:text-slate-600"
              >
                Dismiss
              </button>
            </div>
            
            {/* Timer Display */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-3xl font-black tabular-nums ${restSeconds === 0 ? 'text-green-500' : 'text-liftly-navy'}`}>
                {restMins}:{restSecs.toString().padStart(2, '0')}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setRestSeconds(restTarget); setRestRunning(true); }} 
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all"
                >
                  <RotateCcw size={15} />
                </button>
                <button 
                  onClick={() => setRestRunning(!restRunning)} 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all ${
                    restRunning ? 'bg-orange-100 text-orange-500' : 'bg-liftly-teal/10 text-liftly-teal'
                  }`}
                >
                  {restRunning ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${restSeconds === 0 ? 'bg-green-400' : 'bg-orange-400'}`}
                style={{ width: `${restProgress}%` }}
              />
            </div>
            
            {/* Preset Buttons */}
            <div className="flex gap-2 mt-3">
              {REST_PRESETS.map(sec => (
                <button 
                  key={sec}
                  onClick={() => startRest(sec)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors active:scale-95 ${
                    restTarget === sec && restRunning
                      ? 'bg-liftly-navy text-white border-liftly-navy' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                  {sec === 60 && <span className="block text-[8px] opacity-60">Short</span>}
                  {sec === 90 && <span className="block text-[8px] opacity-60">Normal</span>}
                  {sec === 120 && <span className="block text-[8px] opacity-60">Long</span>}
                  {sec === 180 && <span className="block text-[8px] opacity-60">Max</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            const completedSets = sets.filter(s => s.done).length;
            return (
              <div key={exercise.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Exercise Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 text-liftly-teal flex items-center justify-center shrink-0">
                    <Dumbbell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{exercise.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{exercise.muscleGroup}</p>
                  </div>
                  {completedSets > 0 && (
                    <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-md">
                      {completedSets}/{sets.length}
                    </span>
                  )}
                </div>

                {/* Sets */}
                <div className="px-4 py-3">
                  {/* Column Headers */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Set</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 pl-2">Kg</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 pl-2">Reps</span>
                    </div>
                    <div className="w-10 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Done</span>
                    </div>
                  </div>
                  
                  {sets.map((set, idx) => (
                    <div key={idx} className={`flex items-center gap-2 mb-2 transition-opacity ${set.done ? 'opacity-50' : ''}`}>
                      <div className="w-8 text-center">
                        <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, idx, 'weight', e.target.value)}
                          className="w-full h-11 bg-slate-50 text-center font-bold text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-slate-300"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', e.target.value)}
                          className="w-full h-11 bg-slate-50 text-center font-bold text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-slate-300"
                        />
                      </div>
                      <div className="w-10 flex justify-center">
                        <button
                          onClick={() => toggleSetDone(exercise.id, idx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            set.done 
                              ? 'bg-green-500 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add/Remove Set */}
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => addSet(exercise.id)} className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-500 text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95">
                      <Plus size={14} /> Add Set
                    </button>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(exercise.id)} className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-red-50 border border-dashed border-slate-300 text-slate-400 hover:text-red-500 text-xs font-bold flex items-center justify-center transition-colors active:scale-95">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-30 pointer-events-none">
          <div className="max-w-[480px] mx-auto pointer-events-auto">
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

// ── Live Elapsed Timer ──
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
