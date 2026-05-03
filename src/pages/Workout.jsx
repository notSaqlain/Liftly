import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { getAllExercises, getBodyPartList } from '../services/exerciseApi';
import { Search, Heart, Plus, X, Activity, CalendarDays, Dumbbell, Trash2, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Workout = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [exercisesData, setExercisesData] = useState([]);
  const [muscleFilters, setMuscleFilters] = useState(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [favorites, setFavorites] = useState([]);
  const [customRoutines, setCustomRoutines] = useState({});
  const activeSplit = Object.keys(customRoutines);
  const [addingExerciseId, setAddingExerciseId] = useState(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false);
  const [targetRoutineForAdd, setTargetRoutineForAdd] = useState(null);

  useEffect(() => {
    if (userData) {
      setFavorites(userData.favoriteExercises || []);
      setCustomRoutines(userData.customRoutines || {});
    }
  }, [userData]);

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchQuery, muscleFilter, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [exercises, bodyParts] = await Promise.all([
          getAllExercises(),
          getBodyPartList()
        ]);
        setExercisesData(exercises);
        setMuscleFilters(['All', ...bodyParts]);
      } catch (error) {
        console.error('Error fetching API data:', error);
        showToast('Error loading exercises');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = async (exerciseId) => {
    if (!currentUser) return;
    const isFavorite = favorites.includes(exerciseId);
    const userRef = doc(db, 'users', currentUser.uid);
    setFavorites(prev => isFavorite ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]);
    try {
      await updateDoc(userRef, { favoriteExercises: isFavorite ? arrayRemove(exerciseId) : arrayUnion(exerciseId) });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavorites(userData?.favoriteExercises || []);
    }
  };

  const handleAddClick = (exerciseId) => {
    if (activeSplit.length === 0) {
      showToast('Please create a routine first!');
      return;
    }
    if (targetRoutineForAdd) {
      saveToRoutine(targetRoutineForAdd, exerciseId);
    } else {
      setAddingExerciseId(exerciseId);
    }
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim() || !currentUser) return;
    const name = newRoutineName.trim();
    if (customRoutines[name]) {
      showToast('Routine name already exists!');
      return;
    }
    const updated = { ...customRoutines, [name]: [] };
    setCustomRoutines(updated);
    setShowNewRoutineModal(false);
    setNewRoutineName('');
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { [`customRoutines.${name}`]: [] });
      showToast('Routine created!');
    } catch (e) {
      console.error(e);
      showToast('Error creating routine');
    }
  };

  const handleDeleteRoutine = async (dayName) => {
    if (!currentUser) return;
    const updated = { ...customRoutines };
    delete updated[dayName];
    setCustomRoutines(updated);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { [`customRoutines.${dayName}`]: deleteField() });
      showToast('Routine deleted!');
    } catch (e) {
      console.error(e);
      showToast('Error deleting routine');
    }
  };

  const saveToRoutine = async (dayName, overrideExerciseId = null) => {
    const exerciseToSave = overrideExerciseId || addingExerciseId;
    if (!exerciseToSave || !currentUser) return;

    const updatedRoutines = { ...customRoutines };
    if (!updatedRoutines[dayName]) updatedRoutines[dayName] = [];

    if (!updatedRoutines[dayName].includes(exerciseToSave)) {
      updatedRoutines[dayName] = [...updatedRoutines[dayName], exerciseToSave];
      setCustomRoutines(updatedRoutines);
      if (!overrideExerciseId) setAddingExerciseId(null);

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { [`customRoutines.${dayName}`]: arrayUnion(exerciseToSave) });
        showToast(`Added to ${dayName}!`);
      } catch (error) {
        console.error('Error adding to routine:', error);
        showToast("Error adding exercise.");
        setCustomRoutines(userData?.customRoutines || {});
      }
    } else {
      showToast(`Already in ${dayName}!`);
      if (!overrideExerciseId) setAddingExerciseId(null);
    }
  };

  const removeExercise = async (dayName, exerciseId) => {
    if (!currentUser) return;
    const updatedRoutines = { ...customRoutines };
    if (updatedRoutines[dayName]) {
      updatedRoutines[dayName] = updatedRoutines[dayName].filter(id => id !== exerciseId);
      setCustomRoutines(updatedRoutines);
    }
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { [`customRoutines.${dayName}`]: arrayRemove(exerciseId) });
    } catch (error) {
      console.error('Error removing exercise:', error);
      setCustomRoutines(userData?.customRoutines || {});
    }
  };

  const filteredExercises = exercisesData.filter(ex => {
    const matchSearch = 
      (ex.name && ex.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ex.target && ex.target.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ex.bodyPart && ex.bodyPart.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchMuscle = muscleFilter === 'All' || 
      (ex.bodyPart && ex.bodyPart.toLowerCase() === muscleFilter.toLowerCase());
      
    return matchSearch && matchMuscle;
  });

  const displayedExercises = filteredExercises.slice(0, displayLimit);

  const favoriteExercises = exercisesData.filter(ex => favorites.includes(ex.id));

  const TABS = [
    { key: 'split', icon: <CalendarDays size={15} />, label: 'My Split' },
    { key: 'exercises', icon: <Dumbbell size={15} />, label: 'Exercises' },
    { key: 'favorites', icon: <Heart size={15} />, label: 'Favorites' },
  ];

  const getMuscleColor = (group = '') => {
    const g = group.toLowerCase();
    if (g.includes('chest')) return 'bg-red-50 text-red-600';
    if (g.includes('back') || g.includes('lat')) return 'bg-blue-50 text-blue-600';
    if (g.includes('leg') || g.includes('quad') || g.includes('glute') || g.includes('hamstr') || g.includes('calf')) return 'bg-green-50 text-green-600';
    if (g.includes('shoulder')) return 'bg-purple-50 text-purple-600';
    if (g.includes('arm') || g.includes('bicep') || g.includes('tricep') || g.includes('forearm')) return 'bg-orange-50 text-orange-600';
    if (g.includes('core') || g.includes('abs') || g.includes('waist')) return 'bg-yellow-50 text-yellow-600';
    if (g.includes('cardio')) return 'bg-pink-50 text-pink-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="flex flex-col h-full bg-[#040810] relative">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-bold text-center shadow-lg bg-emerald-500 text-white animate-slide-up">
          {toastMessage}
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-liftly-navy border-b border-white/5 sticky top-0 z-20">
        <div className="px-5 pt-12 pb-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4aa]/10 rounded-full blur-3xl -mr-8 -mt-8" />
          <h1 className="text-2xl font-black text-white mb-4 tracking-tight relative z-10">Workout Hub</h1>

          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-2xl gap-1 relative z-10">
            {TABS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200',
                  activeTab === key
                    ? 'bg-white/10 text-[#00d4aa] shadow-sm'
                    : 'text-white/30 hover:text-white/60'
                )}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter (exercises tab) */}
        {activeTab === 'exercises' && (
          <div className="px-5 pb-3 space-y-2">
            {targetRoutineForAdd && (
              <div className="bg-liftly-navy text-white rounded-2xl p-3 mb-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <Plus size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Adding to</p>
                    <p className="text-sm font-black">{targetRoutineForAdd}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTargetRoutineForAdd(null)}
                  className="px-4 py-1.5 bg-white text-liftly-navy text-xs font-black rounded-xl active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search exercises or muscles…"
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {muscleFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setMuscleFilter(f)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all active:scale-95 capitalize',
                    muscleFilter === f
                      ? 'bg-[#00d4aa] text-[#040810] border-[#00d4aa]'
                      : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-[80px]">

        {/* ── My Split ── */}
        {activeTab === 'split' && (
          <div className="animate-fade-in space-y-4">
            <div className="flex justify-between items-center mt-2">
              <h2 className="font-black text-lg text-white">Your Routines</h2>
              <button onClick={() => setShowNewRoutineModal(true)} className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all border border-white/10">
                <Plus size={14} /> New
              </button>
            </div>

            {activeSplit.length === 0 ? (
              <div className="bg-[#0D1526] rounded-3xl p-10 text-center border border-white/5 mt-4">
                <div className="w-16 h-16 bg-[#00d4aa]/10 text-[#00d4aa] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Dumbbell size={28} />
                </div>
                <h3 className="font-black text-lg text-white mb-2">No Routines Yet</h3>
                <p className="text-white/40 text-sm">Create a custom routine to start building your workout plan.</p>
                <button onClick={() => setShowNewRoutineModal(true)} className="mt-6 px-6 py-3 bg-[#00d4aa] text-[#040810] font-black rounded-2xl active:scale-95 transition-all">
                  Create Routine
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSplit.map((dayName, idx) => {
                  const dayExercises = customRoutines[dayName] || [];
                  return (
                    <div key={idx} className="bg-[#0D1526] rounded-3xl border border-white/5 overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-white">{dayName}</h3>
                          <p className="text-xs text-white/40 font-semibold">{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {dayExercises.length > 0 && (
                            <span className="text-[10px] font-black text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-0.5 rounded-lg border border-[#00d4aa]/20">Active</span>
                          )}
                          <button onClick={() => handleDeleteRoutine(dayName)} className="w-8 h-8 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        {dayExercises.length > 0 ? (
                          dayExercises.map(exId => {
                            const ex = exercisesData.find(e => e.id === exId);
                            if (!ex) return null;
                            return (
                              <div key={exId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                  <Dumbbell size={15} className="text-white/30" />
                                </div>
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/workout/exercise/${ex.id}`)}>
                                  <p className="text-sm font-bold text-white truncate capitalize">{ex.name}</p>
                                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${getMuscleColor(ex.bodyPart)}`}>{ex.bodyPart}</span>
                                </div>
                                <button
                                  onClick={() => removeExercise(dayName, exId)}
                                  className="w-8 h-8 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 text-center">
                            <p className="text-sm text-white/40 font-semibold">No exercises added yet</p>
                            <p className="text-xs text-white/20 mt-0.5">Tap below to add exercises to this routine</p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setTargetRoutineForAdd(dayName);
                            setActiveTab('exercises');
                          }}
                          className="w-full mt-2 py-3 border-2 border-dashed border-[#00d4aa]/30 text-[#00d4aa] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#00d4aa]/5 transition-colors active:scale-[0.98]"
                        >
                          <Plus size={16} /> Add Exercises
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Exercises ── */}
        {activeTab === 'exercises' && (
          <div className="animate-fade-in space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-[#00d4aa] animate-spin mb-4" />
                <p className="text-white/40 font-bold">Caricamento esercizi...</p>
              </div>
            ) : (
              <>
                {displayedExercises.map(exercise => {
                  const isFav = favorites.includes(exercise.id);
                  const isInRoutine = targetRoutineForAdd && customRoutines[targetRoutineForAdd]?.includes(exercise.id);
                  return (
                    <div key={exercise.id} className="bg-[#0D1526] p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                        <Dumbbell size={18} className="text-white/20" />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/workout/exercise/${exercise.id}`)}>
                        <h3 className="font-black text-white text-sm truncate capitalize">{exercise.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getMuscleColor(exercise.bodyPart)}`}>{exercise.bodyPart}</span>
                          <span className="text-[10px] font-semibold text-white/25 capitalize">{exercise.equipment}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(exercise.id)}
                        className={clsx('w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0', isFav ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/20 hover:text-red-400')}
                      >
                        <Heart size={17} className={isFav ? 'fill-red-400' : ''} />
                      </button>
                      <button
                        onClick={() => {
                          if (isInRoutine) {
                            removeExercise(targetRoutineForAdd, exercise.id);
                          } else {
                            handleAddClick(exercise.id);
                          }
                        }}
                        className={clsx(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0",
                          isInRoutine
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                            : "bg-[#00d4aa] text-[#040810]"
                        )}
                      >
                        {isInRoutine ? <Check size={17} /> : <Plus size={17} />}
                      </button>
                    </div>
                  );
                })}
                {filteredExercises.length === 0 && (
                  <div className="text-center py-12">
                    <Dumbbell className="mx-auto text-white/10 w-12 h-12 mb-3" />
                    <p className="text-white/40 font-bold">No exercises found</p>
                    <p className="text-white/20 text-sm">Try a different search or filter</p>
                  </div>
                )}
                {filteredExercises.length > displayLimit && (
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="w-full py-4 text-sm font-bold text-[#00d4aa] bg-[#00d4aa]/5 rounded-2xl border border-[#00d4aa]/10 hover:bg-[#00d4aa]/10 transition-colors active:scale-[0.98]"
                  >
                    Load More Exercises ({filteredExercises.length - displayLimit} remaining)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Favorites ── */}
        {activeTab === 'favorites' && (
          <div className="animate-fade-in space-y-3">
            {favoriteExercises.length === 0 ? (
              <div className="bg-[#0D1526] rounded-3xl p-10 text-center border border-white/5">
                <div className="w-14 h-14 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Heart size={24} className="text-red-400" />
                </div>
                <h3 className="font-black text-white mb-2">No favorites yet</h3>
                <p className="text-white/40 text-sm">Tap the heart on any exercise to save it here.</p>
              </div>
            ) : (
              favoriteExercises.map(exercise => {
                const isInRoutine = targetRoutineForAdd && customRoutines[targetRoutineForAdd]?.includes(exercise.id);
                return (
                  <div key={exercise.id} className="bg-[#0D1526] p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                      <Heart size={18} className="text-red-400 fill-red-400" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/workout/exercise/${exercise.id}`)}>
                      <h3 className="font-black text-white text-sm truncate capitalize">{exercise.name}</h3>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${getMuscleColor(exercise.bodyPart)}`}>{exercise.bodyPart}</span>
                    </div>
                    <button onClick={() => toggleFavorite(exercise.id)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center active:scale-90 transition-all border border-red-500/20">
                      <Heart size={17} className="fill-red-400" />
                    </button>
                    <button
                      onClick={() => {
                        if (isInRoutine) {
                          removeExercise(targetRoutineForAdd, exercise.id);
                        } else {
                          handleAddClick(exercise.id);
                        }
                      }}
                      className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 shrink-0",
                        isInRoutine
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          : "bg-[#00d4aa] text-[#040810]"
                      )}
                    >
                      {isInRoutine ? <Check size={17} /> : <Plus size={17} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add To Routine Modal */}
      {addingExerciseId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0D1526] border border-white/10 w-full max-w-[480px] mx-auto rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-black text-white mb-1">Add to Routine</h3>
            <p className="text-white/40 text-sm mb-5">Which day in your split?</p>
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto no-scrollbar">
              {activeSplit?.map((dayName, idx) => (
                <button
                  key={idx}
                  onClick={() => saveToRoutine(dayName)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-[#00d4aa]/5 border border-white/5 hover:border-[#00d4aa]/20 transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center">
                    <Plus size={16} className="text-[#00d4aa]" />
                  </div>
                  <span className="font-black text-white">{dayName}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddingExerciseId(null)} className="w-full mt-5 py-4 rounded-2xl font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Create New Routine Modal */}
      {showNewRoutineModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0D1526] border border-white/10 w-full max-w-[480px] mx-auto rounded-3xl p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-black text-white mb-1">New Routine</h3>
            <p className="text-white/40 text-sm mb-5">Give your custom routine a name.</p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Chest & Tris, Upper Body"
              value={newRoutineName}
              onChange={e => setNewRoutineName(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa] transition-all mb-5"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewRoutineModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleCreateRoutine} className="flex-1 py-4 rounded-2xl font-bold text-[#040810] bg-[#00d4aa] hover:bg-[#00b894] transition-colors text-sm">
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Workout;
