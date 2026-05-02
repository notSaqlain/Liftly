import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, Dumbbell, MapPin, CheckCircle2, Wrench, AlertCircle, X } from 'lucide-react';

const CATEGORIES = ['All', 'Cables', 'Free Weights', 'Cardio', 'Machines', 'Other'];

const STATUS_CONFIG = {
  'available':   { label: 'Available',   icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'maintenance': { label: 'Maintenance', icon: Wrench,       color: 'text-yellow-500',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  'broken':      { label: 'Broken',      icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20' }
};

const GymEquipment = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedEq, setSelectedEq] = useState(null); // For bottom sheet
  const [loading, setLoading] = useState(true);

  const gymId = userData?.gymId;

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, 'gyms', gymId, 'equipment'), (snap) => {
      setEquipment(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [gymId]);

  const handleUpdateStatus = async (status) => {
    if (!selectedEq || !gymId || !currentUser) return;
    
    try {
      await updateDoc(doc(db, 'gyms', gymId, 'equipment', selectedEq.id), {
        status,
        reportedBy: currentUser.uid,
        reportedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      setSelectedEq(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredEquipment = equipment.filter(eq => 
    activeCategory === 'All' || eq.category === activeCategory
  );

  if (!gymId) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-liftly-teal/15 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-white">Equipment Status</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
            <MapPin size={28} className="text-liftly-teal" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-2">No gym selected</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[260px] mb-6">
            Select your gym in your profile to view its equipment status.
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
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={14} className="text-liftly-teal" />
              <span className="text-liftly-teal text-[10px] font-black uppercase tracking-widest">{userData?.gymName}</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none">Equipment Status</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-20">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all border ${
                activeCategory === cat ? 'bg-liftly-navy text-white border-liftly-navy' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid gap-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-3xl shimmer" />)
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No equipment found in this category.</div>
        ) : (
          filteredEquipment.map(eq => {
            const status = STATUS_CONFIG[eq.status || 'available'];
            const StatusIcon = status.icon;
            return (
              <button
                key={eq.id}
                onClick={() => setSelectedEq(eq)}
                className="bg-white p-4 rounded-3xl shadow-card border border-slate-100 flex items-center justify-between text-left active:scale-[0.98] transition-all"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{eq.name}</h3>
                  <span className="text-[10px] font-semibold text-slate-400">{eq.category}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${status.bg} ${status.border}`}>
                  <StatusIcon size={12} className={status.color} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${status.color}`}>{status.label}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedEq && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[400px] rounded-4xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedEq.name}</h3>
                <p className="text-slate-400 text-sm">Update equipment status</p>
              </div>
              <button onClick={() => setSelectedEq(null)} className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = selectedEq.status === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateStatus(key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      isActive ? `${config.bg} ${config.border} ring-2 ring-offset-2 ring-${config.color.split('-')[1]}-500` : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} className={isActive ? config.color : 'text-slate-400'} />
                    <span className={`font-bold ${isActive ? config.color : 'text-slate-600'}`}>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymEquipment;
