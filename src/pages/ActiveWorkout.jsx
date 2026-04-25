import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import exercisesData from '../data/exercises.json';
import { ChevronLeft, Plus, Minus, Check, Dumbbell, Trophy, Timer, Pause, Play, RotateCcw, Flame } from 'lucide-react';

const REST_PRESETS = [
  { sec: 60, label: '1m', sub: 'Short' },
  { sec: 90, label: '1.5m', sub: 'Normal' },
  { sec: 120, label: '2m', sub: 'Long' },
  { sec: 180, label: '3m', sub: 'Max' },
];

// Returns a string like "2026-W17" for the ISO week of a given date
const getISOWeekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

// Returns the ISO week key of the week preceding the given key (e.g. "2026-W16" → "2026-W17")
const getPrevWeekKey = (weekKey) => {
  const [year, week] = weekKey.split('-W').map(Number);
  if (week === 1) {
    // Go back to last week of previous year (52 or 53)
    const dec28 = new Date(Date.UTC(year - 1, 11, 28));
    return getISOWeekKey(dec28);
  }
  return `${year}-W${String(week - 1).padStart(2, '0')}`;
};

const ActiveWorkout = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayName = searchParams.get('day') || 'Workout';

  const dayExerciseIds = useMemo(() => userData?.customRoutines?.[dayName] || [], [userData, dayName]);
  const exercises = useMemo(() => dayExerciseIds.map(id => exercisesData.find(e => e.id === id)).filter(Boolean), [dayExerciseIds]);

  const [workoutLog, setWorkoutLog] = useState(() => {
    const initial = {};
    exercises.forEach(ex => { initial[ex.id] = [{ weight: '', reps: '', done: false }]; });
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  // Rest Timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTarget, setRestTarget] = useState(90);
  const [restRunning, setRestRunning] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  useEffect(() => {
    if (!restRunning || restSeconds <= 0) return;
    const id = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          setRestRunning(false);
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
    setWorkoutLog(prev => ({ ...prev, [exerciseId]: [...(prev[exerciseId] || []), { weight: '', reps: '', done: false }] }));
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
      if (!wasDone && setIdx === sets.length - 1) {
        sets.push({ weight: sets[setIdx].weight, reps: '', done: false });
      }
      return { ...prev, [exerciseId]: sets };
    });
    const sets = workoutLog[exerciseId] || [];
    if (!sets[setIdx]?.done) startRest(restTarget);
  };

  const totalSets = Object.values(workoutLog).reduce((sum, sets) => sum + sets.filter(s => s.done).length, 0);
  const totalVolume = Object.values(workoutLog).reduce((sum, sets) =>
    sum + sets.filter(s => s.done).reduce((acc, set) => acc + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0), 0
  );

  const handleFinishWorkout = async () => {
    if (!currentUser) return;
    setSaving(true);
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    const now = new Date();
    const currentWeekKey = getISOWeekKey(now);
    const lastWeekKey = userData?.lastWorkoutWeek || '';

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
            sets: sets.filter(s => s.done).map(s => ({ weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps) || 0 }))
          };
        }),
      totalSets,
      totalVolume: Math.round(totalVolume),
      durationMinutes,
      completedAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'user_workouts'), workoutData);

      const userUpdates = {
        totalVolumeLifted: increment(Math.round(totalVolume)),
        totalWorkoutsCompleted: increment(1),
        lastWorkoutDate: serverTimestamp(),
        lastWorkoutWeek: currentWeekKey,
      };

      // ── Weekly Streak Logic ──
      // Streak = number of consecutive calendar weeks with ≥1 workout.
      // This is more realistic than daily streaks since rest days between sessions
      // are normal and encouraged. The streak only breaks if an entire week passes
      // without any workout.
      if (currentWeekKey !== lastWeekKey) {
        // First workout of this week
        const prevWeekKey = getPrevWeekKey(currentWeekKey);
        if (lastWeekKey === prevWeekKey) {
          // Trained last week too → extend the streak
          userUpdates.currentStreak = increment(1);
        } else if (!lastWeekKey) {
          // Very first workout ever
          userUpdates.currentStreak = 1;
        } else {
          // Missed at least one full week → reset streak to 1
          userUpdates.currentStreak = 1;
        }

        // Update longestStreak if we just set a new record
        const projectedStreak = (userData?.currentStreak || 0) +
          (lastWeekKey === prevWeekKey ? 1 : 0);
        if (projectedStreak > (userData?.longestStreak || 0)) {
          userUpdates.longestStreak = projectedStreak;
        }
      }
      // If currentWeekKey === lastWeekKey: already counted this week, no streak change.

      // ── Track best 1RM for big lifts ──
      const currentBest1RM = userData?.best1RM || {};
      workoutData.exercises.forEach(ex => {
        if (['bench_press', 'deadlift', 'squat'].includes(ex.exerciseId)) {
          const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0), 0);
          if (maxWeight > (currentBest1RM[ex.exerciseId] || 0)) {
            // Nested map (for profile display)
            userUpdates[`best1RM.${ex.exerciseId}`] = maxWeight;
            // Flat field (for Leaderboard orderBy — Firestore can't index nested maps)
            userUpdates[`best1RM_${ex.exerciseId}`] = maxWeight;
          }
        }
      });

      await updateDoc(doc(db, 'users', currentUser.uid), userUpdates);
      setFinished(true);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Completion Screen ──
  if (finished) {
    const durationMins = Math.round((Date.now() - startTime) / 60000);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #001540 0%, #002070 60%, #001540 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-liftly-teal/15 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Trophy */}
        <div className="relative mb-8 z-10">
          <div className="w-24 h-24 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center animate-scale-in">
            <Trophy size={48} className="text-yellow-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center animate-float">
            <Flame size={16} className="text-white fill-white" />
          </div>
        </div>

        <div className="z-10">
          <h1 className="text-3xl font-black text-white mb-1">Workout Complete!</h1>
          <p className="text-white/50 mb-8 font-medium">{dayName} · Great work 💪</p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-10 z-10">
          {[
            { label: 'Sets', value: totalSets },
            { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()}kg` },
            { label: 'Duration', value: `${durationMins}m` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/8 border border-white/10 rounded-3xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-black text-white mb-0.5">{value}</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-white/40">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs h-14 text-liftly-navy font-black rounded-3xl shadow-teal-lg active:scale-95 transition-all z-10 text-lg"
          style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
        >
          Back to Home 🏠
        </button>
      </div>
    );
  }

  const restProgress = restTarget > 0 ? ((restTarget - restSeconds) / restTarget) * 100 : 0;
  const restMins = Math.floor(restSeconds / 60);
  const restSecs = restSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="bg-liftly-navy px-4 pt-12 pb-4 flex flex-col sticky top-0 z-20 shadow-navy">
        
        {/* Progress Bar Top Edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-liftly-teal transition-all duration-500 ease-out" style={{ width: `${exercises.length ? (totalSets / (exercises.length * 3)) * 100 : 0}%` }} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-black text-white leading-tight">{dayName}</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-liftly-teal/80">{exercises.length} exercises</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
            <Timer size={12} className="text-liftly-teal" />
            <ElapsedTime startTime={startTime} />
          </div>
        </div>
      </div>

      {/* Rest Timer Banner */}
      {showRestTimer && (
        <div className={`mx-4 mt-3 rounded-2xl overflow-hidden border transition-all ${restSeconds === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 shadow-card'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={15} className={restSeconds === 0 ? 'text-emerald-500' : 'text-orange-500'} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {restSeconds === 0 ? 'Rest Complete!' : 'Rest Timer'}
                </span>
              </div>
              <button onClick={() => setShowRestTimer(false)} className="text-slate-300 text-xs font-bold hover:text-slate-500">Dismiss</button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`text-3xl font-black tabular-nums ${restSeconds === 0 ? 'text-emerald-500' : 'text-liftly-navy'}`}>
                {restMins}:{restSecs.toString().padStart(2, '0')}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setRestSeconds(restTarget); setRestRunning(true); }} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                  <RotateCcw size={15} />
                </button>
                <button onClick={() => setRestRunning(!restRunning)} className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all ${restRunning ? 'bg-orange-100 text-orange-500' : 'bg-liftly-teal/10 text-liftly-teal'}`}>
                  {restRunning ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
              </div>
            </div>

            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${restSeconds === 0 ? 'bg-emerald-400' : 'bg-orange-400'}`} style={{ width: `${restProgress}%` }} />
            </div>

            <div className="flex gap-2">
              {REST_PRESETS.map(({ sec, label, sub }) => (
                <button
                  key={sec}
                  onClick={() => startRest(sec)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95 ${restTarget === sec && restRunning ? 'bg-liftly-navy text-white border-liftly-navy' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                >
                  {label}
                  <span className="block text-[8px] opacity-60 font-semibold">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {exercises.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-card mt-8">
            <Dumbbell className="mx-auto text-slate-200 w-12 h-12 mb-3" />
            <h3 className="font-black text-lg text-slate-800 mb-2">No exercises for {dayName}</h3>
            <p className="text-slate-400 text-sm mb-4">Go to the Workout tab to add exercises to this day.</p>
            <button onClick={() => navigate('/workout')} className="px-6 py-2.5 bg-liftly-teal text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-teal">
              Browse Exercises
            </button>
          </div>
        ) : (
          exercises.map(exercise => {
            const sets = workoutLog[exercise.id] || [{ weight: '', reps: '', done: false }];
            const completedSets = sets.filter(s => s.done).length;
            const progress = completedSets / sets.length;
            return (
              <div key={exercise.id} className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={17} className="text-liftly-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-800 truncate">{exercise.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{exercise.muscleGroup}</p>
                  </div>
                  {completedSets > 0 && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                      {completedSets}/{sets.length}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {completedSets > 0 && (
                  <div className="h-1 bg-slate-50">
                    <div className="h-full bg-liftly-teal transition-all duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
                  </div>
                )}

                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 text-center"><span className="text-[9px] uppercase font-black text-slate-300">Set</span></div>
                    <div className="flex-1"><span className="text-[9px] uppercase font-black text-slate-300 pl-2">Kg</span></div>
                    <div className="flex-1"><span className="text-[9px] uppercase font-black text-slate-300 pl-2">Reps</span></div>
                    <div className="w-10 text-center"><span className="text-[9px] uppercase font-black text-slate-300">✓</span></div>
                  </div>

                  {sets.map((set, idx) => (
                    <div key={idx} className={`flex items-center gap-2 mb-2 transition-all ${set.done ? 'opacity-50' : ''}`}>
                      <div className="w-8 text-center">
                        <span className="text-xs font-black text-slate-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number" inputMode="decimal" placeholder="—" value={set.weight}
                          onChange={(e) => updateSet(exercise.id, idx, 'weight', e.target.value)}
                          className="w-full h-11 bg-slate-50 text-center font-black text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-slate-300 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number" inputMode="numeric" placeholder="—" value={set.reps}
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', e.target.value)}
                          className="w-full h-11 bg-slate-50 text-center font-black text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-slate-300 transition-all"
                        />
                      </div>
                      <div className="w-10 flex justify-center">
                        <button
                          onClick={() => toggleSetDone(exercise.id, idx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${set.done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => addSet(exercise.id)} className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-liftly-teal/5 border border-dashed border-slate-200 hover:border-liftly-teal/30 text-slate-400 hover:text-liftly-teal text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95">
                      <Plus size={13} /> Add Set
                    </button>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(exercise.id)} className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-red-50 border border-dashed border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 text-xs font-black flex items-center justify-center transition-all active:scale-95">
                        <Minus size={13} />
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent z-30 pointer-events-none">
          <div className="max-w-[480px] mx-auto pointer-events-auto">
            <button
              onClick={handleFinishWorkout}
              disabled={saving || totalSets === 0}
              className={`w-full h-14 font-black text-liftly-navy text-lg rounded-3xl shadow-teal-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${totalSets > 0 ? 'animate-bounce-subtle' : ''}`}
              style={{ background: 'linear-gradient(135deg, #00ADB5 0%, #33c4cb 100%)' }}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-liftly-navy/30 border-t-liftly-navy rounded-full animate-spin" />
              ) : (
                <><Trophy size={20} /> Finish · {totalSets} sets done</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ElapsedTime = ({ startTime }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span className="text-xs font-black text-slate-600 tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>;
};

export default ActiveWorkout;
