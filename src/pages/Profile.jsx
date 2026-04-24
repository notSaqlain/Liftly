import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Loader2, User, ChevronRight, Camera, Settings, Trophy, Dumbbell, Flame, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, getUserData, updateUserProfile, isGoogleUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [photoURL, setPhotoURL] = useState('');
  const [googlePhotoURL, setGooglePhotoURL] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [memberSince, setMemberSince] = useState('');

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
        // Fetch total workouts
        const snap = await getDocs(collection(db, 'users', currentUser.uid, 'user_workouts'));
        setTotalWorkouts(snap.size);
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
  const streak = 0; // loaded from userData via useAuth if needed

  return (
    <div className="bg-slate-50 min-h-full">
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
        <div className="absolute top-0 right-0 w-48 h-48 bg-liftly-teal/10 rounded-full blur-3xl -mr-16 -mt-10" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl" />

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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-9 h-9 bg-liftly-teal rounded-xl flex items-center justify-center text-white shadow-teal hover:bg-liftly-teal-dark transition-colors active:scale-90 border-2 border-liftly-navy"
            >
              <Camera size={14} />
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

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full z-10">
          <div className="bg-white/8 border border-white/10 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Dumbbell size={13} className="text-liftly-teal" />
              <span className="text-white font-black text-xl">{totalWorkouts}</span>
            </div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Workouts</span>
          </div>
          <div className="bg-white/8 border border-white/10 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Flame size={13} className="text-orange-400" />
              <span className="text-white font-black text-xl">{/* streak */}🔥</span>
            </div>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">On Fire</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-3">

        {/* Photo Options */}
        {(googleLinked && googlePhotoURL) && (
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Photo Options</p>
            <div className="space-y-2">
              <button onClick={() => fileInputRef.current?.click()} className="w-full h-11 bg-liftly-teal/10 hover:bg-liftly-teal/20 text-liftly-teal font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                <Camera size={16} /> Upload Custom Photo
              </button>
              <button onClick={handleUseGooglePhoto} disabled={saving} className="w-full h-11 bg-slate-50 hover:bg-blue-50 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-200 disabled:opacity-60">
                <img src={googlePhotoURL} alt="Google" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                Use Google Photo
              </button>
              {photoURL && (
                <button onClick={handleRemovePhoto} disabled={saving} className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-60">
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        {[
          {
            icon: <User size={18} />, iconBg: 'bg-blue-50 text-blue-500',
            label: 'Personal Information', sub: 'Body metrics, training & goals', to: '/personal-info'
          },
          {
            icon: <Settings size={18} />, iconBg: 'bg-slate-100 text-slate-500',
            label: 'Account Settings', sub: 'Email, password, security & more', to: '/settings'
          },
        ].map(({ icon, iconBg, label, sub, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-card border border-slate-100 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</span>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm">{label}</p>
                <p className="text-slate-400 text-xs">{sub}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        ))}

        <p className="text-center text-slate-300 text-xs mt-8 pb-4">Liftly v1.0 · Built with ❤️</p>
      </div>
    </div>
  );
};

export default Profile;
