import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Flame, Users, Activity, CheckCircle2, Play, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [reportedStatus, setReportedStatus] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [workoutDates, setWorkoutDates] = useState(new Set());

  // Fetch workout dates for the displayed month
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchWorkoutDates = async () => {
      const startOfMonth = new Date(calendarYear, calendarMonth, 1);
      const endOfMonth = new Date(calendarYear, calendarMonth + 1, 0, 23, 59, 59);
      
      try {
        const q = query(
          collection(db, 'users', currentUser.uid, 'user_workouts'),
          where('completedAt', '>=', Timestamp.fromDate(startOfMonth)),
          where('completedAt', '<=', Timestamp.fromDate(endOfMonth))
        );
        const snap = await getDocs(q);
        const dates = new Set();
        snap.forEach(doc => {
          const d = doc.data().completedAt?.toDate();
          if (d) dates.add(d.getDate());
        });
        setWorkoutDates(dates);
      } catch (error) {
        console.error("Error fetching workout dates:", error);
      }
    };
    
    fetchWorkoutDates();
  }, [currentUser, calendarMonth, calendarYear]);

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    // getDay() returns 0 for Sunday, adjust so Monday=0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = [];
    
    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [calendarMonth, calendarYear]);

  const today = new Date();
  const isCurrentMonth = calendarMonth === today.getMonth() && calendarYear === today.getFullYear();

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const reportCrowd = async (status) => {
    if (!currentUser || reportedStatus) return;
    try {
      await addDoc(collection(db, 'gym_status'), {
        status,
        reportedBy: currentUser.uid,
        timestamp: serverTimestamp()
      });
      setReportedStatus(true);
    } catch (error) {
      console.error("Error reporting gym status:", error);
    }
  };

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;
  const activeSplit = userData?.activeSplit || null;

  const handleStartWorkout = () => {
    if (!activeSplit || activeSplit.length === 0) {
      navigate('/workout');
      return;
    }
    setShowSplitPicker(true);
  };

  const handleSelectDay = (dayName) => {
    setShowSplitPicker(false);
    navigate(`/active-workout?day=${encodeURIComponent(dayName)}`);
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center p-6 h-[80vh]">
        <div className="animate-pulse flex flex-col items-center">
           <Activity className="text-liftly-teal w-12 h-12 mb-4 animate-spin" />
           <p className="text-slate-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      
      {/* Header section with Greeting and Streak */}
      <div className="flex justify-between items-start pt-6">
        <div className="flex items-center gap-3">
          {photoURL ? (
            <img src={photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover ring-2 ring-liftly-teal/30 shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-liftly-navy flex items-center justify-center text-white font-bold text-lg shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-liftly-navy tracking-tight truncate max-w-[180px]">
              Hi, <span className="capitalize">{displayName}</span>!
            </h1>
            <p className="text-slate-500 text-sm font-medium">Ready to crush your goals?</p>
          </div>
        </div>
        
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center shrink-0">
          <div className="flex items-center space-x-1">
            <Flame className="text-orange-500 fill-orange-500" size={20} />
            <span className="text-xl font-bold text-slate-800">{userData?.currentStreak || 0}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Streak</span>
        </div>
      </div>

      {/* Start Workout Primary Action */}
      <div className="pt-2">
        <button 
          onClick={handleStartWorkout}
          className="w-full relative overflow-hidden group bg-liftly-navy rounded-[2rem] p-6 shadow-xl active:scale-95 transition-all duration-200 border border-slate-800 h-44 flex flex-col justify-end text-left focus:outline-none focus:ring-4 focus:ring-liftly-teal/50"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-liftly-teal/30 transition-colors"></div>
          
          <div className="flex justify-between items-end w-full relative z-10">
            <div>
              <h2 className="text-white text-3xl font-extrabold mb-1 tracking-tight">Start Workout</h2>
              <p className="text-slate-300 font-medium text-sm">
                {activeSplit ? `${activeSplit.length}-day split active` : 'Log a new session'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-liftly-teal text-white flex items-center justify-center shadow-[0_4px_20px_0_rgba(0,173,181,0.4)] transform group-hover:scale-110 group-active:scale-95 transition-all duration-300 shrink-0">
              <Play size={28} className="ml-1 fill-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Today's Split Quick Links */}
      {activeSplit && activeSplit.length > 0 && (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200/60">
          <h3 className="font-bold text-slate-800 text-sm mb-3">What are we hitting today?</h3>
          <div className="grid grid-cols-3 gap-2">
            {activeSplit.map((dayName, idx) => (
              <button 
                key={idx}
                onClick={() => handleSelectDay(dayName)}
                className="py-3 px-2 rounded-xl bg-slate-50 hover:bg-liftly-teal/10 border border-slate-100 hover:border-liftly-teal/30 transition-all active:scale-95 text-center group"
              >
                <p className="text-xs font-bold text-slate-700 group-hover:text-liftly-teal truncate">{dayName}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Workout Calendar */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-liftly-teal" />
            <h3 className="font-bold text-slate-800 text-sm">Workout Calendar</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-600 min-w-[110px] text-center">
              {MONTHS[calendarMonth]} {calendarYear}
            </span>
            <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wider text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            
            const isToday = isCurrentMonth && day === today.getDate();
            const hasWorkout = workoutDates.has(day);
            
            return (
              <div
                key={day}
                className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isToday
                    ? 'bg-liftly-navy text-white'
                    : hasWorkout
                    ? 'bg-liftly-teal/15 text-liftly-teal'
                    : 'text-slate-600'
                }`}
              >
                {day}
                {hasWorkout && !isToday && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-liftly-teal" />
                )}
                {hasWorkout && isToday && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-liftly-navy" />
            <span className="text-[10px] font-medium text-slate-400">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-liftly-teal/30" />
            <span className="text-[10px] font-medium text-slate-400">Workout</span>
          </div>
        </div>
      </div>

      {/* Crowdsourcing Widget */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-center space-x-2 mb-5">
          <span className="bg-blue-50 text-blue-500 p-2 rounded-xl">
            <Users size={20} />
          </span>
          <h3 className="font-bold text-slate-800 text-lg">Gym Crowd Status</h3>
        </div>
        
        {reportedStatus ? (
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl flex items-center space-x-3 transition-all">
             <CheckCircle2 size={24} className="text-green-500 shrink-0" />
             <p className="font-medium text-sm">Thanks for reporting! Your update helps everyone.</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-5 font-medium">How crowded is your gym right now?</p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => reportCrowd('LOW')}
                className="h-20 flex flex-col items-center justify-center rounded-2xl bg-slate-50 hover:bg-green-50 border border-slate-100/50 hover:border-green-200 transition-all active:scale-95 group focus:outline-none"
              >
                <div className="w-4 h-4 rounded-full bg-slate-200 group-hover:bg-green-500 mb-2 transition-colors"></div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-green-700 transition-colors">Low</span>
              </button>
              
              <button 
                onClick={() => reportCrowd('MEDIUM')}
                className="h-20 flex flex-col items-center justify-center rounded-2xl bg-slate-50 hover:bg-yellow-50 border border-slate-100/50 hover:border-yellow-200 transition-all active:scale-95 group focus:outline-none"
              >
                <div className="w-4 h-4 rounded-full bg-slate-200 group-hover:bg-yellow-500 mb-2 transition-colors"></div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-yellow-700 transition-colors">Medium</span>
              </button>
              
              <button 
                onClick={() => reportCrowd('HIGH')}
                className="h-20 flex flex-col items-center justify-center rounded-2xl bg-slate-50 hover:bg-red-50 border border-slate-100/50 hover:border-red-200 transition-all active:scale-95 group focus:outline-none"
              >
                <div className="w-4 h-4 rounded-full bg-slate-200 group-hover:bg-red-500 mb-2 transition-colors"></div>
                <span className="text-xs font-bold text-slate-400 group-hover:text-red-700 transition-colors">High</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Split Day Picker Modal */}
      {showSplitPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[400px] rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-2">What are we hitting today?</h3>
            <p className="text-slate-500 text-sm mb-6">Select today's workout</p>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {activeSplit.map((dayName, idx) => {
                const dayExercises = userData?.customRoutines?.[dayName] || [];
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDay(dayName)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left active:scale-[0.98]"
                  >
                    <div>
                      <span className="font-bold text-slate-700">{dayName}</span>
                      <p className="text-xs text-slate-400">{dayExercises.length} exercises</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => setShowSplitPicker(false)}
              className="w-full mt-6 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spacer for bottom nav */}
      <div className="h-4"></div>
    </div>
  );
};

export default Dashboard;
