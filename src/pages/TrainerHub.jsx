import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronLeft, Users, MapPin, MessageCircle, X } from 'lucide-react';

const TrainerHub = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const gymId = userData?.gymId;

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }

    const fetchTrainers = async () => {
      try {
        const snap = await getDocs(collection(db, 'gyms', gymId, 'trainers'));
        setTrainers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Error fetching trainers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [gymId]);

  if (!gymId) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-white">Personal Trainers</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-liftly-teal/10 flex items-center justify-center mb-4">
            <MapPin size={28} className="text-liftly-teal" />
          </div>
          <h3 className="font-black text-slate-800 text-lg mb-2">No gym license active</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[260px] mb-6">
            Activate your Liftly PRO license to view available personal trainers.
          </p>
          <button onClick={() => navigate('/my-plan')} className="px-6 py-3 bg-liftly-teal text-white font-black rounded-2xl active:scale-95 shadow-teal">
            Activate License →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-20 relative">
      <div className="bg-liftly-navy px-6 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-purple-400" />
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">{userData?.gymName}</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-none">Personal Trainers</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-slate-200 rounded-3xl shimmer" />)}
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-20">
            <Users size={32} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">No trainers registered yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trainers.map(trainer => (
              <button
                key={trainer.id}
                onClick={() => setSelectedTrainer(trainer)}
                className="bg-white rounded-3xl overflow-hidden shadow-card border border-slate-100 flex flex-col active:scale-[0.98] transition-all text-left"
              >
                <div className="aspect-square bg-slate-100 relative">
                  {trainer.photoURL ? (
                    <img src={trainer.photoURL} alt={trainer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-50">
                      <Users size={32} className="text-purple-200" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm leading-tight mb-1">{trainer.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {trainer.specializations?.slice(0, 2).map((spec, i) => (
                        <span key={i} className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">{spec}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTrainer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-slide-up">
          <div className="relative h-64 shrink-0">
            {selectedTrainer.photoURL ? (
              <img src={selectedTrainer.photoURL} alt={selectedTrainer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                <Users size={64} className="text-purple-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <button onClick={() => setSelectedTrainer(null)} className="absolute top-12 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <X size={20} />
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-3xl font-black text-white leading-tight">{selectedTrainer.name}</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-3">Specializations</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTrainer.specializations?.map((spec, i) => (
                <span key={i} className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl">{spec}</span>
              ))}
            </div>

            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-2">About</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">{selectedTrainer.bio || 'No bio provided.'}</p>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <button
              onClick={() => navigate(`/messages/search?uid=${selectedTrainer.id}&name=${encodeURIComponent(selectedTrainer.name)}`)}
              className="w-full bg-liftly-teal text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-teal active:scale-[0.98] transition-all"
            >
              <MessageCircle size={18} /> Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerHub;
