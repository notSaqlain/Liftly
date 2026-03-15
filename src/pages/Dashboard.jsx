import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Flame, Users, Activity, CheckCircle2, Play } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [reportedStatus, setReportedStatus] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

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

  const displayName = currentUser?.email?.split('@')[0] || 'Lifter';

  if (loading) {
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
        <div>
          <h1 className="text-4xl font-extrabold text-liftly-navy tracking-tight truncate max-w-[200px]">
            Hi, <span className="capitalize">{displayName}</span>!
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Ready to crush your goals?</p>
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
        <button className="w-full relative overflow-hidden group bg-liftly-navy rounded-[2rem] p-6 shadow-xl active:scale-95 transition-all duration-200 border border-slate-800 h-44 flex flex-col justify-end text-left focus:outline-none focus:ring-4 focus:ring-liftly-teal/50">
          <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-liftly-teal/30 transition-colors"></div>
          
          <div className="flex justify-between items-end w-full relative z-10">
            <div>
              <h2 className="text-white text-3xl font-extrabold mb-1 tracking-tight">Start Workout</h2>
              <p className="text-slate-300 font-medium text-sm">Log a new session</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-liftly-teal text-white flex items-center justify-center shadow-[0_4px_20px_0_rgba(0,173,181,0.4)] transform group-hover:scale-110 group-active:scale-95 transition-all duration-300 shrink-0">
              <Play size={28} className="ml-1 fill-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Crowdsourcing Widget */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 mt-4">
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

    </div>
  );
};

export default Dashboard;
