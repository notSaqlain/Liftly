import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, User, Users, ChevronRight, Camera, Pencil, Settings, Dumbbell, Flame, TrendingUp, Trophy, Star, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACHIEVEMENTS = [
  { id: 'first', label: 'First Workout', icon: '🏋️', threshold: 1, stat: 'workouts' },
  { id: 'ten', label: '10 Workouts', icon: '💪', threshold: 10, stat: 'workouts' },
  { id: 'fifty', label: '50 Workouts', icon: '🔥', threshold: 50, stat: 'workouts' },
  { id: 'points500', label: 'Bronze Lifter', icon: '🥉', threshold: 500, stat: 'points' },
  { id: 'points1000', label: 'Silver Lifter', icon: '🥈', threshold: 1000, stat: 'points' },
  { id: 'volume100k', label: '100k kg Lifted', icon: '🏆', threshold: 100000, stat: 'volume' },
];

const Profile = () => {
  const { currentUser, userData, getUserData, updateUserProfile, isGoogleUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const [photoURL, setPhotoURL] = useState('');
  const [googlePhotoURL, setGooglePhotoURL] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [memberSince, setMemberSince] = useState('');

  // Read points from live userData
  const points = userData?.points || 0;

  const fileInputRef = { current: null };

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          setPhotoURL(data.photoURL || currentUser.photoURL || '');
          setGooglePhotoURL(data.googlePhotoURL || currentUser.photoURL || '');
          setDisplayName(data.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User');
          if (data.createdAt?.toDate) {
            setMemberSince(data.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          }
        } else {
          setPhotoURL(currentUser.photoURL || '');
          setDisplayName(currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User');
        }
        // Fetch workouts for stats
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'user_workouts'));
        setTotalWorkouts(snap.size);
        let vol = 0;
        snap.forEach(d => { vol += d.data().totalVolume || 0; });
        setTotalVolume(vol);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser, getUserData]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showMessage('Image must be less than 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoPreview) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { photoURL: photoPreview });
      setPhotoURL(photoPreview);
      setPhotoPreview(null);
      showMessage('Profile picture updated!');
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { photoURL: '' });
      setPhotoURL('');
      setPhotoPreview(null);
      showMessage('Profile picture removed');
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleUseGooglePhoto = async () => {
    if (!googlePhotoURL) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { photoURL: googlePhotoURL });
      setPhotoURL(googlePhotoURL);
      setPhotoPreview(null);
      showMessage('Google photo set as profile picture!');
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6 h-[80vh]">
        <Loader2 className="text-liftly-teal w-10 h-10 animate-spin" />
      </div>
    );
  }

  const currentPhoto = photoPreview || photoURL;
  const googleLinked = isGoogleUser();

  const fmtVolume = (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toString();

  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    if (a.stat === 'workouts') return totalWorkouts >= a.threshold;
    if (a.stat === 'points') return points >= a.threshold;
    if (a.stat === 'volume') return totalVolume >= a.threshold;
    return false;
  });

  return (
    <div className="bg-[#040810] min-h-full">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-bold text-center shadow-lg animate-slide-up ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>{message.text}</div>
      )}

      <input
        ref={(el) => { fileInputRef.current = el; }}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Hero Header */}
      <div className="bg-liftly-navy relative overflow-hidden pt-12 pb-10 px-6 flex flex-col items-center">
        <div className="absolute top-0 right-0 w-56 h-56 bg-liftly-teal/10 rounded-full blur-3xl -mr-16 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />

        {/* Avatar */}
        <div className="relative mb-4 z-10">
          <div className="relative">
            {currentPhoto ? (
              <img src={currentPhoto} alt="Profile" className="w-24 h-24 rounded-3xl object-cover ring-4 ring-liftly-teal/30 shadow-teal" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-liftly-teal/20 border-2 border-liftly-teal/30 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Pen / Edit button */}
            <button
              onClick={() => setShowPhotoSheet(true)}
              className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#00d4aa] rounded-xl flex items-center justify-center text-[#040810] shadow-[0_0_12px_rgba(0,212,170,0.5)] active:scale-90 transition-all border-2 border-[#040810]"
            >
              <Pencil size={13} strokeWidth={2.5} />
            </button>
          </div>

          {photoPreview && (
            <div className="flex gap-2 mt-4">
              <button onClick={handleSavePhoto} disabled={saving} className="px-4 py-2 bg-liftly-teal text-white text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Photo'}
              </button>
              <button onClick={() => setPhotoPreview(null)} className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl active:scale-95 transition-all">Cancel</button>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black text-white capitalize z-10">{displayName}</h1>
        <p className="text-white/40 text-sm mt-1 z-10">{currentUser?.email}</p>
        {memberSince && <p className="text-liftly-teal/70 text-xs font-bold mt-1 z-10">Member since {memberSince}</p>}

        {/* Stats Strip — 3 cards now */}
        <div className="grid grid-cols-3 gap-2.5 mt-6 w-full z-10">
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Dumbbell size={12} className="text-liftly-teal" />
              <span className="text-white font-black text-xl">{totalWorkouts}</span>
            </div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Sessions</span>
          </div>
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-white font-black text-xl">{points}</span>
            </div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Points</span>
          </div>
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp size={12} className="text-purple-400" />
              <span className="text-white font-black text-xl">{fmtVolume(totalVolume)}</span>
            </div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">kg Lifted</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-3">

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-[#0D1526] rounded-3xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy size={15} className="text-yellow-500" />
              </div>
              <h2 className="font-black text-white text-sm">Achievements</h2>
              <span className="ml-auto text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-lg">
                {unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.some(u => u.id === a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      unlocked
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-white/5 border-white/5 text-white/30'
                    }`}
                  >
                    <span className={unlocked ? '' : 'grayscale opacity-40'}>{a.icon}</span>
                    {a.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photo Options section removed — now lives in the bottom sheet */}

        {/* Navigation Links */}
        {[
          {
            icon: <CreditCard size={18} />, iconBg: 'bg-emerald-500/10 text-emerald-500',
            label: 'My Plan', sub: 'License, features & expiration', to: '/my-plan'
          },
          {
            icon: <User size={18} />, iconBg: 'bg-blue-500/10 text-blue-500',
            label: 'Personal Information', sub: 'Body metrics, training & goals', to: '/personal-info'
          },
          {
            icon: <Trophy size={18} />, iconBg: 'bg-yellow-500/10 text-yellow-500',
            label: 'Leaderboard', sub: 'Global rankings & community stats', to: '/leaderboard'
          },
          {
            icon: <Settings size={18} />, iconBg: 'bg-slate-500/10 text-slate-400',
            label: 'Account Settings', sub: 'Email, password, security & more', to: '/settings'
          },
        ].map(({ icon, iconBg, label, sub, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full bg-[#0D1526] rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</span>
              <div className="text-left">
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-white/40 text-xs">{sub}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/20" />
          </button>
        ))}

        <p className="text-center text-slate-300 text-xs mt-8 pb-4">Liftly v1.0 · Built with ❤️</p>
      </div>
      {/* Photo Options Bottom Sheet */}
      {showPhotoSheet && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPhotoSheet(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-t-3xl p-6 pb-8 animate-slide-up"
            style={{
              background: 'rgba(13, 21, 38, 0.98)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-white">Change Photo</h3>
                <p className="text-white/40 text-xs mt-0.5">Choose how to update your profile picture</p>
              </div>
              <button
                onClick={() => setShowPhotoSheet(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Camera */}
              <button
                onClick={() => { setShowPhotoSheet(false); setTimeout(() => { /* trigger camera via accept */ const inp = fileInputRef.current; if (inp) { inp.setAttribute('capture', 'environment'); inp.click(); } }, 100); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-all border"
                style={{ background: 'rgba(0,212,170,0.07)', borderColor: 'rgba(0,212,170,0.2)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/15 flex items-center justify-center shrink-0">
                  <Camera size={18} className="text-[#00d4aa]" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Take a Photo</p>
                  <p className="text-white/40 text-xs">Use your camera</p>
                </div>
              </button>

              {/* Device */}
              <button
                onClick={() => { setShowPhotoSheet(false); setTimeout(() => { const inp = fileInputRef.current; if (inp) { inp.removeAttribute('capture'); inp.click(); } }, 100); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-all border"
                style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.2)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Upload from Device</p>
                  <p className="text-white/40 text-xs">Pick from your gallery or files</p>
                </div>
              </button>

              {/* Google Photo */}
              {googleLinked && googlePhotoURL && (
                <button
                  onClick={() => { setShowPhotoSheet(false); handleUseGooglePhoto(); }}
                  disabled={saving}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-all border disabled:opacity-60"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <img src={googlePhotoURL} alt="Google" className="w-10 h-10 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-bold text-white text-sm">Use Google Photo</p>
                    <p className="text-white/40 text-xs">Your Google account picture</p>
                  </div>
                </button>
              )}

              {/* Remove */}
              {photoURL && (
                <button
                  onClick={() => { setShowPhotoSheet(false); handleRemovePhoto(); }}
                  disabled={saving}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-[0.98] transition-all border border-red-500/20 disabled:opacity-60"
                  style={{ background: 'rgba(239,68,68,0.07)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <X size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-red-400 text-sm">Remove Photo</p>
                    <p className="text-white/30 text-xs">Revert to default avatar</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
