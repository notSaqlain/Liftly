import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, Dumbbell, MapPin, CheckCircle2, Wrench, AlertCircle, X } from 'lucide-react';

const CATEGORIES = ['All', 'Cables', 'Free Weights', 'Cardio', 'Machines', 'Other'];

const STATUS_CONFIG = {
  'available':   { label: 'Available',   icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'maintenance': { label: 'Maintenance', icon: Wrench,       color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  'broken':      { label: 'Broken',      icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' }
};

const GymEquipment = () => {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedEq, setSelectedEq] = useState(null);
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
      <div className="bg-[#040810] min-h-screen flex flex-col">
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
          <h3 className="font-black text-white text-lg mb-2">No gym license active</h3>
          <p className="text-white/40 text-sm leading-relaxed max-w-[260px] mb-6">
            Activate your Liftly PRO license to view its equipment status.
          </p>
          <button onClick={() => navigate('/my-plan')} className="px-6 py-3 bg-liftly-teal text-liftly-navy font-black rounded-2xl active:scale-95 shadow-teal">
            Activate License →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#040810] min-h-screen flex flex-col pb-20">
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

      {/* Category filter bar */}
      <div className="px-4 py-4 bg-[#0D1526] border-b border-white/5 sticky top-0 z-20">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-black transition-all border ${
                activeCategory === cat 
                  ? 'bg-liftly-teal text-liftly-navy border-liftly-teal shadow-teal' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid gap-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-20 bg-white/5 rounded-3xl shimmer" />)
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-10 text-white/40 text-sm">No equipment found in this category.</div>
        ) : (
          filteredEquipment.map(eq => {
            const statusKey = (eq.status || 'available').toLowerCase();
            const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG['available'];
            const StatusIcon = status.icon;
            return (
              <button
                key={eq.id}
                onClick={() => setSelectedEq(eq)}
                className="bg-[#0D1526] p-4 rounded-3xl border border-white/5 flex items-center justify-between text-left active:scale-[0.98] transition-all hover:bg-white/5"
              >
                <div>
                  <h3 className="font-bold text-white text-sm">{eq.name}</h3>
                  <span className="text-[10px] font-semibold text-white/40">{eq.category}</span>
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0D1526] w-full max-w-[400px] rounded-4xl p-6 shadow-2xl border border-white/10 animate-slide-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-white">{selectedEq.name}</h3>
                <p className="text-white/40 text-sm">Update equipment status</p>
              </div>
              <button onClick={() => setSelectedEq(null)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = (selectedEq.status || 'available').toLowerCase() === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateStatus(key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      isActive ? `${config.bg} ${config.border} ring-2 ring-offset-1 ring-offset-[#0D1526]` : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} className={isActive ? config.color : 'text-white/40'} />
                    <span className={`font-bold ${isActive ? config.color : 'text-white/60'}`}>{config.label}</span>
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
