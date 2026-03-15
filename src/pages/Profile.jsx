import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, User, ChevronRight, Camera, Settings } from 'lucide-react';

const Profile = () => {
  const { currentUser, getUserData, updateUserProfile, isGoogleUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState(null);

  // Photo state
  const [photoURL, setPhotoURL] = useState('');
  const [googlePhotoURL, setGooglePhotoURL] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [displayName, setDisplayName] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          setPhotoURL(data.photoURL || currentUser.photoURL || '');
          setGooglePhotoURL(data.googlePhotoURL || currentUser.photoURL || '');
          setDisplayName(data.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User');
        } else {
          setPhotoURL(currentUser.photoURL || '');
          setGooglePhotoURL(currentUser.photoURL || '');
          setDisplayName(currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User');
        }
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
      setActiveSection(null);
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
      setActiveSection(null);
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
      setActiveSection(null);
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6 h-[80vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Loader2 className="text-liftly-teal w-10 h-10 animate-spin" />
        </div>
      </div>
    );
  }

  const currentPhoto = photoPreview || photoURL;
  const googleLinked = isGoogleUser();

  return (
    <div className="p-6 pb-24 min-h-full bg-slate-50">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-medium text-center shadow-lg ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>{message.text}</div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-6 mb-8">
        <div className="relative mb-4">
          {currentPhoto ? (
            <img src={currentPhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-liftly-teal/20 shadow-lg" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-liftly-navy flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-liftly-teal rounded-full flex items-center justify-center text-white shadow-md hover:bg-teal-400 transition-colors active:scale-90 border-2 border-white">
            <Camera size={14} />
          </button>
        </div>

        {photoPreview && (
          <div className="flex gap-2 mb-3">
            <button onClick={handleSavePhoto} disabled={saving} className="px-4 py-2 bg-liftly-teal text-white text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Photo'}
            </button>
            <button onClick={() => setPhotoPreview(null)} className="px-4 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 transition-all">Cancel</button>
          </div>
        )}

        <h1 className="text-2xl font-extrabold text-liftly-navy capitalize">{displayName}</h1>
        <p className="text-slate-400 text-sm mt-1">{currentUser?.email}</p>
      </div>

      {/* ─── Profile Picture ─── */}
      <AccordionItem title="Profile Picture" subtitle="Change or remove your photo" icon={<Camera size={20} />} iconBg="bg-teal-50 text-liftly-teal" isOpen={activeSection === 'photo'} onToggle={() => setActiveSection(activeSection === 'photo' ? null : 'photo')}>
        <button onClick={() => fileInputRef.current?.click()} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95">
          <Camera size={16} /><span>Upload Custom Photo</span>
        </button>
        {googleLinked && googlePhotoURL && (
          <button onClick={handleUseGooglePhoto} disabled={saving} className="w-full h-12 bg-white hover:bg-blue-50 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-200 disabled:opacity-60">
            <img src={googlePhotoURL} alt="Google" className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-200" referrerPolicy="no-referrer" />
            <span>Use Google Photo</span>
          </button>
        )}
        {photoURL && (
          <button onClick={handleRemovePhoto} disabled={saving} className="w-full h-12 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-60">
            Remove Current Photo
          </button>
        )}
      </AccordionItem>

      {/* ─── Personal Info Link ─── */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/personal-info')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-blue-50 text-blue-500 p-2.5 rounded-xl"><User size={20} /></span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Personal Information</p>
              <p className="text-slate-400 text-xs">Body metrics, training & goals</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>

      {/* ─── Account Settings Link ─── */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-slate-100 text-slate-600 p-2.5 rounded-xl"><Settings size={20} /></span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Account Settings</p>
              <p className="text-slate-400 text-xs">Email, password, security & more</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>

      <p className="text-center text-slate-300 text-xs mt-8">Liftly v1.0</p>
    </div>
  );
};

const AccordionItem = ({ title, subtitle, icon, iconBg, isOpen, onToggle, children }) => (
  <div className="mb-4">
    <button onClick={onToggle} className={`w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all ${isOpen ? 'mb-3' : ''}`}>
      <div className="flex items-center space-x-3">
        <span className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</span>
        <div className="text-left">
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-slate-400 text-xs truncate max-w-[200px]">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={18} className={`text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
    </button>
    {isOpen && (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
        {children}
      </div>
    )}
  </div>
);

export default Profile;
