import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, Target, MapPin, Clock, Plus } from 'lucide-react';

const GymChallenges = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [logModal, setLogModal] = useState(null);
  const [logValue, setLogValue] = useState('');

  const gymId = userData?.gymId;

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }

    const fetchChallenges = async () => {
      try {
        const q = query(
          collection(db, 'gym_challenges', gymId, 'challenges'),
          where('endsAt', '>', new Date())
        );
        const snap = await getDocs(q);
        
        const loaded = [];
        for (const d of snap.docs) {
          const data = d.data();
          
          // Fetch top 5 entries
          const entriesQ = query(collection(d.ref, 'entries'), orderBy('value', 'desc'), limit(5));
          const entriesSnap = await getDocs(entriesQ);
          const entries = entriesSnap.docs.map(ed => ({ id: ed.id, ...ed.data() }));

          loaded.push({
            id: d.id,
            ...data,
            entries
          });
        }
        setChallenges(loaded);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [gymId]);

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!logModal || !gymId || !currentUser || !logValue) return;

    try {
      const val = parseFloat(logValue);
      await setDoc(doc(db, 'gym_challenges', gymId, 'challenges', logModal.id, 'entries', currentUser.uid), {
        value: val,
        updatedAt: serverTimestamp(),
        displayName: userData?.firstName || currentUser.displayName || 'Lifter',
        photoURL: userData?.photoURL || currentUser.photoURL || null
      });
      
      // Optimistic update
      setChallenges(prev => prev.map(c => {
        if (c.id !== logModal.id) return c;
        const newEntries = [...c.entries.filter(e => e.id !== currentUser.uid), {
          id: currentUser.uid,
          value: val,
          displayName: userData?.firstName || currentUser.displayName || 'Lifter',
          photoURL: userData?.photoURL || currentUser.photoURL || null
        }].sort((a, b) => b.value - a.value).slice(0, 5);
        return { ...c, entries: newEntries };
      }));

      setLogModal(null);
      setLogValue('');
    } catch (error) {
      console.error('Error logging progress:', error);
    }
  };

  if (!gymId) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-white">Challenges</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
            <MapPin size={28} className="text-liftly-teal" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-2">No gym selected</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[260px] mb-6">
            Select your gym to participate in local challenges.
          </p>
          <button onClick={() => navigate('/personal-info')} className="px-6 py-3 bg-liftly-teal text-white font-black rounded-2xl active:scale-95 shadow-teal">
            Set My Gym →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-20">
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-orange-400" />
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{userData?.gymName}</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none">Challenges</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-40 bg-slate-200 rounded-3xl shimmer" />)
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <Target size={32} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">No active challenges yet</p>
            <p className="text-slate-400 text-sm mt-1">Your gym admin will create them soon.</p>
          </div>
        ) : (
          challenges.map(challenge => {
            const isExpanded = expandedId === challenge.id;
            const daysLeft = Math.ceil((challenge.endsAt.toDate() - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={challenge.id} className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 text-lg">{challenge.title}</h3>
                    <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                      <Clock size={12} /> {daysLeft}d left
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2">{challenge.description}</p>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-50 pt-4 bg-slate-50/50">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Target size={14} className="text-liftly-teal" /> Leaderboard
                    </h4>
                    
                    {challenge.entries.length === 0 ? (
                      <p className="text-slate-400 text-sm italic mb-4">No entries yet. Be the first!</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {challenge.entries.map((entry, idx) => (
                          <div key={entry.id} className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                                #{idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {entry.photoURL ? (
                                  <img src={entry.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{entry.displayName.charAt(0)}</div>
                                )}
                                <span className="font-bold text-sm text-slate-700">{entry.displayName}</span>
                              </div>
                            </div>
                            <span className="font-black text-liftly-navy">{entry.value} <span className="text-[10px] text-slate-400 uppercase">{challenge.metric}</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setLogModal(challenge); }}
                      className="w-full py-3 bg-liftly-teal/10 text-liftly-teal font-black rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Log My Progress
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {logModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-4xl p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-black text-slate-800 mb-1">{logModal.title}</h3>
            <p className="text-slate-400 text-sm mb-6">Enter your total {logModal.metric}</p>
            
            <form onSubmit={handleLogProgress}>
              <div className="flex items-center gap-3 mb-6">
                <input
                  type="number"
                  step="any"
                  value={logValue}
                  onChange={e => setLogValue(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal"
                  placeholder="0"
                  required
                />
                <span className="font-black text-slate-400 uppercase tracking-widest">{logModal.metric}</span>
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3.5 bg-liftly-teal text-white font-black rounded-2xl shadow-teal">Save</button>
                <button type="button" onClick={() => setLogModal(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymChallenges;
