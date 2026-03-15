import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import exercisesData from '../data/exercises.json';
import { Search, Heart, Plus, ChevronRight, Activity, CalendarDays, Dumbbell } from 'lucide-react';
import clsx from 'clsx';

const Workout = () => {
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('split');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for UI responsiveness before Firebase syncs back
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
    
    // Optimistic UI update
    setFavorites(prev => 
      isFavorite ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]
    );

    try {
      await updateDoc(userRef, {
        favoriteExercises: isFavorite ? arrayRemove(exerciseId) : arrayUnion(exerciseId)
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update
      setFavorites(userData?.favoriteExercises || []);
    }
  };

  const handleAddClick = (exerciseId) => {
    if (!activeSplit || activeSplit.length === 0) {
      alert("Please configure a split in your Account Settings first!");
      return;
    }
    setAddingExerciseId(exerciseId);
  };

  const saveToRoutine = async (dayName) => {
    if (!addingExerciseId || !currentUser) return;
    
    // Optimistic UI update
    const updatedRoutines = { ...customRoutines };
    if (!updatedRoutines[dayName]) updatedRoutines[dayName] = [];
    if (!updatedRoutines[dayName].includes(addingExerciseId)) {
        updatedRoutines[dayName] = [...updatedRoutines[dayName], addingExerciseId];
    }
    setCustomRoutines(updatedRoutines);
    setAddingExerciseId(null);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`customRoutines.${dayName}`]: arrayUnion(addingExerciseId)
      });
    } catch (error) {
      console.error("Error adding to routine:", error);
      setCustomRoutines(userData?.customRoutines || {}); // Revert
    }
  };

  const removeExercise = async (dayName, exerciseId) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    const updatedRoutines = { ...customRoutines };
    if (updatedRoutines[dayName]) {
      updatedRoutines[dayName] = updatedRoutines[dayName].filter(id => id !== exerciseId);
      setCustomRoutines(updatedRoutines);
    }
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        [`customRoutines.${dayName}`]: arrayRemove(exerciseId)
      });
    } catch (error) {
      console.error("Error removing exercise:", error);
      setCustomRoutines(userData?.customRoutines || {}); // Revert
    }
  };

  const filteredExercises = exercisesData.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="pt-6 px-6 pb-2 bg-white sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-black text-liftly-navy mb-4 tracking-tight">Workout Hub</h1>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
          <button 
            onClick={() => setActiveTab('split')}
            className={clsx(
              "flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === 'split' ? "bg-white text-liftly-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CalendarDays size={16} />
            My Split
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            className={clsx(
              "flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === 'exercises' ? "bg-white text-liftly-teal shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Dumbbell size={16} />
            Exercises
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {activeTab === 'split' && (
          <div className="animate-in fade-in duration-300">
            {!activeSplit ? (
              <div className="bg-white rounded-[2rem] p-8 text-center border border-slate-200 shadow-sm mt-4">
                <div className="w-16 h-16 bg-blue-50 text-liftly-teal rounded-full flex items-center justify-center mx-auto mb-4">
                   <Activity size={32} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">No Split Configured</h3>
                <p className="text-slate-500 text-sm mb-6">Head over to your Account Settings to set up your weekly workout split.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-lg text-slate-800">Your Current Routine</h2>
                  <span className="bg-liftly-teal/10 text-liftly-teal px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{activeSplit.length} Days</span>
                </div>
                
                {activeSplit.map((dayName, idx) => {
                  const dayExercises = customRoutines[dayName] || [];
                  return (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800">{dayName}</h3>
                        <span className="text-xs font-semibold text-slate-400">{dayExercises.length} exercises</span>
                      </div>
                      
                      {dayExercises.length > 0 ? (
                        <div className="space-y-2">
                          {dayExercises.map(exId => {
                            const ex = exercisesData.find(e => e.id === exId);
                            if (!ex) return null;
                            return (
                              <div key={exId} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                   <Dumbbell size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{ex.name}</p>
                                  <p className="text-[10px] uppercase font-bold text-slate-400">{ex.muscleGroup}</p>
                                </div>
                                <button 
                                  onClick={() => removeExercise(dayName, exId)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Activity size={16} className="rotate-45" /> {/* pseudo-X mark */}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                           <p className="text-sm text-slate-500 font-medium">No exercises added yet.</p>
                           <p className="text-xs text-slate-400 mt-1">Browse exercises and add them here.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="animate-in fade-in duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search exercises or muscles..."
                className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filteredExercises.map(exercise => {
                const isFav = favorites.includes(exercise.id);
                return (
                  <div key={exercise.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                       <h3 className="font-bold text-slate-800 text-sm truncate">{exercise.name}</h3>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-liftly-teal bg-liftly-teal/10 px-2 py-0.5 rounded-md">{exercise.muscleGroup}</span>
                          <span className="text-[10px] font-bold text-slate-400">{exercise.equipment}</span>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleFavorite(exercise.id)}
                      className={clsx(
                        "p-2 rounded-full transition-all active:scale-95",
                        isFav ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400 hover:text-red-400"
                      )}
                    >
                      <Heart size={20} className={isFav ? "fill-red-500" : ""} />
                    </button>
                    
                    <button 
                      onClick={() => handleAddClick(exercise.id)}
                      className="p-2 bg-liftly-navy text-white rounded-full transition-all active:scale-95 shadow-md"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                );
              })}
              
              {filteredExercises.length === 0 && (
                <div className="text-center py-10">
                  <Dumbbell className="mx-auto text-slate-300 w-12 h-12 mb-3" />
                  <p className="text-slate-500 font-medium">No exercises found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add To Routine Modal */}
      {addingExerciseId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[400px] rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Add to Routine</h3>
            <p className="text-slate-500 text-sm mb-6">Select which day in your split to add this exercise to.</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {activeSplit?.map((dayName, idx) => (
                <button
                  key={idx}
                  onClick={() => saveToRoutine(dayName)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left"
                >
                  <span className="font-bold text-slate-700">{dayName}</span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200 text-liftly-teal">
                    <Plus size={16} />
                  </div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setAddingExerciseId(null)}
              className="w-full mt-6 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workout;
