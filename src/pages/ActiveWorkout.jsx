import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, Plus, Minus, Check, Dumbbell, Trophy, Timer, Pause, Play, RotateCcw, Flame } from 'lucide-react';
import { getAllExercises } from '../services/exerciseApi';

const REST_PRESETS = [
  { sec: 60, label: '1m', sub: 'Short' },
  { sec: 90, label: '1.5m', sub: 'Normal' },
  { sec: 120, label: '2m', sub: 'Long' },
  { sec: 180, label: '3m', sub: 'Max' },
];
import { getPointsUpdate, POINTS_MAP } from '../utils/points';
const ActiveWorkout = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dayName = searchParams.get('day') || 'Workout';

  const dayExerciseIds = useMemo(() => userData?.customRoutines?.[dayName] || [], [userData, dayName]);
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);

  const [workoutLog, setWorkoutLog] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const allExercises = await getAllExercises();
        const activeExs = dayExerciseIds.map(id => allExercises.find(e => e.id === id)).filter(Boolean);
        setExercises(activeExs);
        
        const initialLog = {};
        activeExs.forEach(ex => { initialLog[ex.id] = [{ weight: '', reps: '', done: false }]; });
        setWorkoutLog(initialLog);
      } catch (err) {
        console.error('Error fetching exercises:', err);
      } finally {
        setExercisesLoading(false);
      }
    };
    loadData();
  }, [dayExerciseIds]);

  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const [startTime] = useState(Date.now());

  // Rest Timer
  const [restElapsed, setRestElapsed] = useState(0);
  const [restTarget, setRestTarget] = useState(90);
  const [restRunning, setRestRunning] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  useEffect(() => {
    if (!restRunning) return;
    const id = setInterval(() => {
      setRestElapsed(prev => {
        if (prev + 1 === restTarget) {
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning, restTarget]);

  const startRest = useCallback((seconds, forceRestart = false) => {
    setRestTarget(seconds);
    if (forceRestart) {
      setRestElapsed(0);
    } else if (restElapsed >= seconds) {
      // If user sets a target lower than what's already elapsed, complete it
      setRestElapsed(seconds);
      setRestRunning(false);
    }
    setRestRunning(true);
    setShowRestTimer(true);
  }, [restElapsed]);

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
    if (!sets[setIdx]?.done) startRest(restTarget, true);
  };

  const totalSets = Object.values(workoutLog).reduce((sum, sets) => sum + sets.filter(s => s.done).length, 0);
  const totalVolume = Object.values(workoutLog).reduce((sum, sets) =>
    sum + sets.filter(s => s.done).reduce((acc, set) => acc + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0), 0
  );

  const handleFinishWorkout = async () => {
    if (!currentUser) return;
    setSaving(true);
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);

    setFinalStats({
      sets: totalSets,
      volume: Math.round(totalVolume),
      duration: durationMinutes
    });

    const workoutData = {
      userId: currentUser.uid,
      day: dayName,
      exercises: Object.entries(workoutLog)
        .filter(([_, sets]) => sets.some(s => s.done))
        .map(([exerciseId, sets]) => {
          const ex = exercises.find(e => e.id === exerciseId);
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
    const pointsUpdate = getPointsUpdate(userData, 'WORKOUT_COMPLETED', true);

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'user_workouts'), workoutData);

      const userUpdates = {
        totalVolumeLifted: increment(Math.round(totalVolume)),
        totalWorkoutsCompleted: increment(1),
        lastWorkoutDate: serverTimestamp(),
        ...pointsUpdate,
      };

      // ── Track best 1RM for big lifts ──
      const BIG_LIFTS_MAP = {
        '0025': 'bench_press',
        '0032': 'deadlift',
        '0043': 'squat'
      };

      const currentBest1RM = userData?.best1RM || {};
      workoutData.exercises.forEach(ex => {
        const liftKey = BIG_LIFTS_MAP[ex.exerciseId];
        if (liftKey) {
          const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0), 0);
          if (maxWeight > (currentBest1RM[liftKey] || 0)) {
            // Nested map (for profile display)
            userUpdates[`best1RM.${liftKey}`] = maxWeight;
            // Flat field (for Leaderboard orderBy — Firestore can't index nested maps)
            userUpdates[`best1RM_${liftKey}`] = maxWeight;
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
  if (finished && finalStats) {
    const pointsUpdate = getPointsUpdate(userData, 'WORKOUT_COMPLETED', true);
    const pointsEarned = Object.keys(pointsUpdate).length > 0 ? POINTS_MAP.WORKOUT_COMPLETED : 0;
    const newTotal = (userData?.points || 0) + pointsEarned;

    return (
      <div className="min-h-full flex flex-col animate-fade-in relative overflow-hidden bg-[#040810]">
        {/* Background glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F38] via-[#040810] to-[#040810]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#00d4aa]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-56 h-56 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-6 text-center">

          {/* Trophy icon */}
          <div className="relative mb-6">
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center animate-scale-in"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                border: '1px solid rgba(251,191,36,0.25)',
                boxShadow: '0 0 40px rgba(251,191,36,0.15)',
              }}
            >
              <Trophy size={52} className="text-yellow-400" />
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-3xl animate-ping opacity-20" style={{ border: '2px solid rgba(251,191,36,0.5)' }} />
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight mb-1">Workout Complete!</h1>
          <p className="text-white/40 font-medium mb-8 text-sm">
            {dayName} · Great work 💪
          </p>

          {/* Points earned badge */}
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.05))',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
              <Trophy size={18} className="text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400/60">Points Earned</p>
              <p className="text-white font-black text-lg leading-none">
                +{pointsEarned}
                <span className="text-white/30 text-sm font-bold ml-2">→ {newTotal} total</span>
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full mb-10">
            {[
              { label: 'Sets',     value: finalStats.sets,                                 color: '#00d4aa' },
              { label: 'Volume',   value: `${finalStats.volume.toLocaleString()}kg`, color: '#818cf8' },
              { label: 'Duration', value: `${finalStats.duration}m`,                        color: '#f97316' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-2xl p-4 text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
                <p className="text-[9px] uppercase tracking-widest font-bold text-white/30">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/')}
            className="w-full max-w-xs h-14 font-black rounded-3xl active:scale-95 transition-all text-[#040810] text-lg shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #00b894)',
              boxShadow: '0 8px 32px rgba(0,212,170,0.35)',
            }}
          >
            Back to Home
          </button>

        </div>
      </div>
    );
  }

  const overage = Math.max(0, restElapsed - restTarget);
  const displayTarget = restElapsed > restTarget ? restTarget : restElapsed;
  const restProgress = restTarget > 0 ? (displayTarget / restTarget) * 100 : 0;
  
  const restMins = Math.floor(displayTarget / 60);
  const restSecs = displayTarget % 60;
  
  const overageMins = Math.floor(overage / 60);
  const overageSecs = overage % 60;

  const isRestComplete = restElapsed >= restTarget;

  return (
    <div className="min-h-screen bg-[#040810] flex flex-col animate-fade-in">

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
        <div className={`mx-4 mt-3 rounded-2xl overflow-hidden border transition-all ${isRestComplete ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#0D1526] border-white/5'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={15} className={isRestComplete ? 'text-emerald-400' : 'text-orange-400'} />
                <span className="text-xs font-black uppercase tracking-wider text-white/50">
                  {isRestComplete ? 'Rest Complete!' : `Target: ${Math.floor(restTarget/60)}m ${restTarget%60}s`}
                </span>
              </div>
              <button onClick={() => setShowRestTimer(false)} className="text-white/30 text-xs font-bold hover:text-white/60">Dismiss</button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`text-3xl font-black tabular-nums flex items-baseline ${isRestComplete ? 'text-emerald-400 animate-pulse' : 'text-white'}`}>
                {restMins}:{restSecs.toString().padStart(2, '0')}
                {overage > 0 && <span className="text-xl ml-1 text-emerald-400">+{overageMins > 0 ? `${overageMins}:` : ''}{overageSecs.toString().padStart(2, '0')}</span>}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setRestElapsed(0); setRestRunning(true); }} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 active:scale-90 transition-all">
                  <RotateCcw size={15} />
                </button>
                <button onClick={() => setRestRunning(!restRunning)} className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all ${restRunning ? 'bg-orange-500/10 text-orange-400' : 'bg-liftly-teal/10 text-liftly-teal'}`}>
                  {restRunning ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>
              </div>
            </div>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${isRestComplete ? 'bg-emerald-400' : 'bg-orange-400'}`} style={{ width: `${restProgress}%` }} />
            </div>

            <div className="flex gap-2">
              {REST_PRESETS.map(({ sec, label, sub }) => (
                <button
                  key={sec}
                  onClick={() => startRest(sec, false)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95 ${restTarget === sec && !isRestComplete ? 'bg-liftly-teal text-[#040810] border-liftly-teal' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10'}`}
                >
                  {label}
                  <span className="block text-[8px] opacity-60 font-semibold">{sub}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  const val = window.prompt("Enter custom rest time in seconds:", "60");
                  const parsed = parseInt(val, 10);
                  if (parsed > 0) startRest(parsed, false);
                }}
                className="flex-1 py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95 bg-white/5 text-white/50 border-white/5 hover:bg-white/10 flex flex-col items-center justify-center"
              >
                Custom
                <span className="block text-[8px] opacity-60 font-semibold">Set Secs</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {exercisesLoading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-2 border-liftly-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="bg-[#0D1526] rounded-3xl p-10 text-center border border-white/5 mt-8">
            <Dumbbell className="mx-auto text-white/10 w-12 h-12 mb-3" />
            <h3 className="font-black text-lg text-white mb-2">No exercises for {dayName}</h3>
            <p className="text-white/40 text-sm mb-4">Go to the Workout tab to add exercises to this day.</p>
            <button onClick={() => navigate('/workout')} className="px-6 py-2.5 bg-liftly-teal text-[#040810] font-bold text-sm rounded-xl active:scale-95 transition-all shadow-teal">
              Browse Exercises
            </button>
          </div>
        ) : (
          exercises.map(exercise => {
            const sets = workoutLog[exercise.id] || [{ weight: '', reps: '', done: false }];
            const completedSets = sets.filter(s => s.done).length;
            const progress = completedSets / sets.length;
            return (
              <div key={exercise.id} className="bg-[#0D1526] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-liftly-teal/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={17} className="text-liftly-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-white truncate">{exercise.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">{exercise.muscleGroup || exercise.bodyPart}</p>
                  </div>
                  {completedSets > 0 && (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0 border border-emerald-500/20">
                      {completedSets}/{sets.length}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {completedSets > 0 && (
                  <div className="h-1 bg-[#040810]">
                    <div className="h-full bg-liftly-teal transition-all duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
                  </div>
                )}

                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-8 text-center"><span className="text-[9px] uppercase font-black text-white/30">Set</span></div>
                    <div className="flex-1"><span className="text-[9px] uppercase font-black text-white/30 pl-2">Kg</span></div>
                    <div className="flex-1"><span className="text-[9px] uppercase font-black text-white/30 pl-2">Reps</span></div>
                    <div className="w-10 text-center"><span className="text-[9px] uppercase font-black text-white/30">✓</span></div>
                  </div>

                  {sets.map((set, idx) => (
                    <div key={idx} className={`flex items-center gap-2 mb-2 transition-all ${set.done ? 'opacity-50' : ''}`}>
                      <div className="w-8 text-center">
                        <span className="text-xs font-black text-white/40">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number" inputMode="decimal" placeholder="—" value={set.weight}
                          onChange={(e) => updateSet(exercise.id, idx, 'weight', e.target.value)}
                          className="w-full h-11 bg-white/5 text-center font-black text-sm text-white rounded-xl border border-white/10 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-white/20 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number" step="1" inputMode="numeric" placeholder="—" value={set.reps}
                          onChange={(e) => updateSet(exercise.id, idx, 'reps', e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-11 bg-white/5 text-center font-black text-sm text-white rounded-xl border border-white/10 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal placeholder:text-white/20 transition-all"
                        />
                      </div>
                      <div className="w-10 flex justify-center">
                        <button
                          onClick={() => toggleSetDone(exercise.id, idx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${set.done ? 'bg-emerald-500 text-[#040810]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => addSet(exercise.id)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/10 text-white/40 hover:text-white text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95">
                      <Plus size={13} /> Add Set
                    </button>
                    {sets.length > 1 && (
                      <button onClick={() => removeSet(exercise.id)} className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-500/10 border border-dashed border-white/10 hover:border-red-500/30 text-white/40 hover:text-red-400 text-xs font-black flex items-center justify-center transition-all active:scale-95">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#040810] via-[#040810]/90 to-transparent z-30 pointer-events-none">
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
  return <span className="text-xs font-black text-white/80 tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>;
};

export default ActiveWorkout;
