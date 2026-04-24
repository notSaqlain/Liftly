import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import exercisesData from '../data/exercises.json';
import { Search, Heart, Plus, X, Activity, CalendarDays, Dumbbell, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const Workout = () => {
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [favorites, setFavorites] = useState([]);
  const [customRoutines, setCustomRoutines] = useState({});
  const [activeSplit, setActiveSplit] = useState(null);
  const [addingExerciseId, setAddingExerciseId] = useState(null);

  useEffect(() => {
    if (userData) {
      setFavorites(userData.favoriteExercises || []);
      setCustomRoutines(userData.customRoutines || {});
      setActiveSplit(userData.activeSplit || null);
    }
  }, [userData]);

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
    if (!activeSplit || activeSplit.length === 0) {
      showToast('Please configure a split in Account Settings first!');
      return;
    }
    setAddingExerciseId(exerciseId);
  };

  const saveToRoutine = async (dayName) => {
    if (!addingExerciseId || !currentUser) return;
    const updatedRoutines = { ...customRoutines };
    if (!updatedRoutines[dayName]) updatedRoutines[dayName] = [];
    if (!updatedRoutines[dayName].includes(addingExerciseId)) {
      updatedRoutines[dayName] = [...updatedRoutines[dayName], addingExerciseId];
    }
    setCustomRoutines(updatedRoutines);
    setAddingExerciseId(null);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { [`customRoutines.${dayName}`]: arrayUnion(addingExerciseId) });
      showToast(`Added to ${dayName}!`);
    } catch (error) {
      console.error('Error adding to routine:', error);
      showToast("Error adding exercise.");
      setCustomRoutines(userData?.customRoutines || {});
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
    const matchSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMuscle = muscleFilter === 'All' || ex.muscleGroup.toLowerCase().includes(muscleFilter.toLowerCase());
    return matchSearch && matchMuscle;
  });

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
    if (g.includes('leg') || g.includes('quad') || g.includes('glute') || g.includes('hamstr')) return 'bg-green-50 text-green-600';
    if (g.includes('shoulder')) return 'bg-purple-50 text-purple-600';
    if (g.includes('arm') || g.includes('bicep') || g.includes('tricep')) return 'bg-orange-50 text-orange-600';
    if (g.includes('core') || g.includes('abs')) return 'bg-yellow-50 text-yellow-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-bold text-center shadow-lg bg-emerald-500 text-white animate-slide-up">
          {toastMessage}
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="px-5 pt-12 pb-3">
          <h1 className="text-2xl font-black text-liftly-navy mb-4 tracking-tight">Workout Hub</h1>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            {TABS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={clsx(
                  'flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200',
                  activeTab === key
                    ? 'bg-white text-liftly-teal shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
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
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercises or muscles…"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {MUSCLE_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setMuscleFilter(f)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all active:scale-95',
                    muscleFilter === f
                      ? 'bg-liftly-teal text-white border-liftly-teal shadow-teal'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
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
      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">

        {/* ── My Split ── */}
        {activeTab === 'split' && (
          <div className="animate-fade-in">
            {!activeSplit ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-card mt-4">
                <div className="w-16 h-16 bg-liftly-teal/10 text-liftly-teal rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Activity size={28} />
                </div>
                <h3 className="font-black text-lg text-slate-800 mb-2">No Split Configured</h3>
                <p className="text-slate-400 text-sm">Head to Account Settings to set up your weekly workout split.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-black text-lg text-slate-800">Your Routine</h2>
                  <span className="bg-liftly-teal/10 text-liftly-teal px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">{activeSplit.length} Days</span>
                </div>

                {activeSplit.map((dayName, idx) => {
                  const dayExercises = customRoutines[dayName] || [];
                  return (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-slate-800">{dayName}</h3>
                          <p className="text-xs text-slate-400 font-semibold">{dayExercises.length} exercise{dayExercises.length !== 1 ? 's' : ''}</p>
                        </div>
                        {dayExercises.length > 0 && (
                          <span className="text-[10px] font-black text-liftly-teal bg-liftly-teal/10 px-2 py-0.5 rounded-lg">Active</span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        {dayExercises.length > 0 ? (
                          dayExercises.map(exId => {
                            const ex = exercisesData.find(e => e.id === exId);
                            if (!ex) return null;
                            return (
                              <div key={exId} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                  <Dumbbell size={15} className="text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{ex.name}</p>
                                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${getMuscleColor(ex.muscleGroup)}`}>{ex.muscleGroup}</span>
                                </div>
                                <button
                                  onClick={() => removeExercise(dayName, exId)}
                                  className="w-8 h-8 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center">
                            <p className="text-sm text-slate-400 font-semibold">No exercises added yet</p>
                            <p className="text-xs text-slate-300 mt-0.5">Browse the Exercises tab to add some</p>
                          </div>
                        )}
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
            {filteredExercises.map(exercise => {
              const isFav = favorites.includes(exercise.id);
              return (
                <div key={exercise.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 text-sm truncate">{exercise.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getMuscleColor(exercise.muscleGroup)}`}>{exercise.muscleGroup}</span>
                      <span className="text-[10px] font-semibold text-slate-300">{exercise.equipment}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(exercise.id)}
                    className={clsx('w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0', isFav ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-400')}
                  >
                    <Heart size={17} className={isFav ? 'fill-red-500' : ''} />
                  </button>
                  <button
                    onClick={() => handleAddClick(exercise.id)}
                    className="w-9 h-9 bg-liftly-navy text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-navy shrink-0"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              );
            })}
            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <Dumbbell className="mx-auto text-slate-200 w-12 h-12 mb-3" />
                <p className="text-slate-400 font-bold">No exercises found</p>
                <p className="text-slate-300 text-sm">Try a different search or filter</p>
              </div>
            )}
          </div>
        )}

        {/* ── Favorites ── */}
        {activeTab === 'favorites' && (
          <div className="animate-fade-in space-y-3">
            {favoriteExercises.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-card">
                <div className="w-14 h-14 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-red-400" />
                </div>
                <h3 className="font-black text-slate-800 mb-2">No favorites yet</h3>
                <p className="text-slate-400 text-sm">Tap the heart on any exercise to save it here.</p>
              </div>
            ) : (
              favoriteExercises.map(exercise => (
                <div key={exercise.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <Heart size={18} className="text-red-400 fill-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-800 text-sm truncate">{exercise.name}</h3>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${getMuscleColor(exercise.muscleGroup)}`}>{exercise.muscleGroup}</span>
                  </div>
                  <button onClick={() => toggleFavorite(exercise.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-all">
                    <Heart size={17} className="fill-red-500" />
                  </button>
                  <button onClick={() => handleAddClick(exercise.id)} className="w-9 h-9 bg-liftly-navy text-white rounded-xl flex items-center justify-center active:scale-90 shadow-navy shrink-0">
                    <Plus size={17} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add To Routine Modal */}
      {addingExerciseId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-4xl p-6 shadow-2xl animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-black text-slate-800 mb-1">Add to Routine</h3>
            <p className="text-slate-400 text-sm mb-5">Which day in your split?</p>
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto no-scrollbar">
              {activeSplit?.map((dayName, idx) => (
                <button
                  key={idx}
                  onClick={() => saveToRoutine(dayName)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-liftly-teal/5 border border-slate-100 hover:border-liftly-teal/20 transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-liftly-teal/10 flex items-center justify-center">
                    <Plus size={16} className="text-liftly-teal" />
                  </div>
                  <span className="font-black text-slate-700">{dayName}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddingExerciseId(null)} className="w-full mt-5 py-4 rounded-2xl font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workout;
