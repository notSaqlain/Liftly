import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Save, Loader2, User, Mail, Lock, Weight, Calendar, ChevronRight, Camera, Link2, Trash2, ShieldAlert } from 'lucide-react';

const Profile = () => {
  const { 
    currentUser, logout, getUserData, updateUserProfile, 
    updateUserEmail, updateUserPassword, updateDisplayName, 
    linkGoogleAccount, deleteAccount, isGoogleUser, hasPasswordProvider 
  } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('Other');
  const [photoURL, setPhotoURL] = useState('');
  const [googlePhotoURL, setGooglePhotoURL] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          setUserData(data);
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setAge(data.age?.toString() || '');
          setWeight(data.weight?.toString() || '');
          setGender(data.gender || 'Other');
          setPhotoURL(data.photoURL || currentUser.photoURL || '');
          setGooglePhotoURL(data.googlePhotoURL || currentUser.photoURL || '');
          setBackupEmail(data.backupEmail || '');
        } else {
          setPhotoURL(currentUser.photoURL || '');
          setGooglePhotoURL(currentUser.photoURL || '');
        }
        setNewEmail(currentUser.email || '');
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
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image must be less than 2MB', 'error');
      return;
    }
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
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { photoURL: '' });
      setPhotoURL('');
      setPhotoPreview(null);
      showMessage('Profile picture removed');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
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
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { firstName, lastName, age: parseInt(age, 10), weight: parseFloat(weight), gender });
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) await updateDisplayName(displayName);
      showMessage('Profile updated successfully!');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      await updateUserEmail(newEmail);
      showMessage('Verification link sent to your new email! Check your inbox.');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBackupEmail = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { backupEmail });
      showMessage('Backup email saved!');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) return showMessage('Passwords do not match', 'error');
    if (newPassword.length < 6) return showMessage('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await updateUserPassword(newPassword);
      showMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    setSaving(true);
    try {
      await linkGoogleAccount();
      showMessage('Google account linked successfully!');
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        showMessage('This Google account is already linked to another user.', 'error');
      } else {
        showMessage(err.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteAccount();
      // User will be redirected to login by ProtectedRoute automatically
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        showMessage('Please sign out and sign back in before deleting your account.', 'error');
      } else {
        showMessage(err.message, 'error');
      }
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error('Logout error:', err); }
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

  const displayName = firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';
  const currentPhoto = photoPreview || photoURL;
  const googleLinked = isGoogleUser();
  const passwordLinked = hasPasswordProvider();

  return (
    <div className="p-6 pb-24 min-h-full bg-slate-50">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-medium text-center shadow-lg ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Hidden file input */}
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
        
        {/* Provider badges */}
        <div className="flex gap-2 mt-3">
          {googleLinked && (
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </span>
          )}
          {passwordLinked && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Email/Password</span>
          )}
        </div>
      </div>

      {/* ─── Profile Picture ─── */}
      <AccordionItem
        title="Profile Picture"
        subtitle="Change or remove your photo"
        icon={<Camera size={20} />}
        iconBg="bg-teal-50 text-liftly-teal"
        isOpen={activeSection === 'photo'}
        onToggle={() => setActiveSection(activeSection === 'photo' ? null : 'photo')}
      >
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

      {/* ─── Personal Info ─── */}
      <AccordionItem
        title="Personal Information"
        subtitle="Name, age, weight, gender"
        icon={<User size={20} />}
        iconBg="bg-blue-50 text-blue-500"
        isOpen={activeSection === 'personal'}
        onToggle={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
      >
        <div className="flex space-x-3">
          <input type="text" placeholder="First Name" className="w-1/2 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Last Name" className="w-1/2 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="flex space-x-3">
          <div className="relative w-1/2">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" placeholder="Age" min="12" max="120" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="relative w-1/2">
            <Weight size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="number" placeholder="Weight (kg)" step="0.1" min="20" max="300" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal appearance-none" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <button onClick={handleSavePersonal} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save Changes</span></>}
        </button>
      </AccordionItem>

      {/* ─── Email (conditionally rendered based on provider) ─── */}
      {googleLinked && !passwordLinked ? (
        // Google-only account: show backup email instead
        <AccordionItem
          title="Backup Email"
          subtitle="Add a recovery email address"
          icon={<Mail size={20} />}
          iconBg="bg-green-50 text-green-500"
          isOpen={activeSection === 'email'}
          onToggle={() => setActiveSection(activeSection === 'email' ? null : 'email')}
        >
          <p className="text-slate-400 text-xs mb-2">Your Google email ({currentUser?.email}) cannot be changed. You can add a backup email for recovery.</p>
          <input type="email" placeholder="Backup email address" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={backupEmail} onChange={(e) => setBackupEmail(e.target.value)} />
          <button onClick={handleSaveBackupEmail} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save Backup Email</span></>}
          </button>
        </AccordionItem>
      ) : (
        // Email/password account: allow changing email
        <AccordionItem
          title="Email Address"
          subtitle={currentUser?.email}
          icon={<Mail size={20} />}
          iconBg="bg-green-50 text-green-500"
          isOpen={activeSection === 'email'}
          onToggle={() => setActiveSection(activeSection === 'email' ? null : 'email')}
        >
          <input type="email" placeholder="New email address" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button onClick={handleSaveEmail} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Email</span></>}
          </button>
        </AccordionItem>
      )}

      {/* ─── Password (only for email/password accounts) ─── */}
      {passwordLinked && (
        <AccordionItem
          title="Change Password"
          subtitle="Update your password"
          icon={<Lock size={20} />}
          iconBg="bg-purple-50 text-purple-500"
          isOpen={activeSection === 'password'}
          onToggle={() => setActiveSection(activeSection === 'password' ? null : 'password')}
        >
          <input type="password" placeholder="New password" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" placeholder="Confirm new password" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button onClick={handleSavePassword} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Password</span></>}
          </button>
        </AccordionItem>
      )}

      {/* ─── Link Google (only for email/password accounts without Google) ─── */}
      {passwordLinked && !googleLinked && (
        <div className="mb-4">
          <button
            onClick={handleLinkGoogle}
            disabled={saving}
            className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className="bg-blue-50 text-blue-500 p-2.5 rounded-xl"><Link2 size={20} /></span>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm">Connect Google Account</p>
                <p className="text-slate-400 text-xs">Link your Google for easy sign-in</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin text-slate-400" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
            </div>
          </button>
        </div>
      )}

      {/* ─── Logout ─── */}
      <div className="mt-8">
        <button onClick={handleLogout} className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-red-100">
          <LogOut size={18} /><span>Sign Out</span>
        </button>
      </div>

      {/* ─── Delete Account ─── */}
      <div className="mt-4">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full h-12 text-red-400 hover:text-red-500 font-medium text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all">
            <Trash2 size={14} /><span>Delete Account</span>
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <ShieldAlert size={18} />
              <p className="font-bold text-sm">This action is permanent</p>
            </div>
            <p className="text-red-500 text-xs">Your account, workouts, and all data will be permanently deleted. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={saving} className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-11 bg-white text-slate-600 font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-slate-300 text-xs mt-6">Liftly v1.0</p>
    </div>
  );
};

// Reusable accordion component
const AccordionItem = ({ title, subtitle, icon, iconBg, isOpen, onToggle, children }) => (
  <div className="mb-4">
    <button onClick={onToggle} className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all">
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
      <div className="bg-white rounded-2xl p-5 mt-2 shadow-sm border border-slate-100 space-y-3">
        {children}
      </div>
    )}
  </div>
);

export default Profile;
