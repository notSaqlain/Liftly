import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LogOut, Save, Loader2, Mail, Lock, ChevronLeft, ChevronRight, Link2, Trash2, ShieldAlert, Dumbbell } from 'lucide-react';

const AccountSettings = () => {
  const { 
    currentUser, logout, getUserData, updateUserProfile,
    updateUserEmail, updateUserPassword,
    linkGoogleAccount, deleteAccount, isGoogleUser, hasPasswordProvider 
  } = useAuth();

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const availableSplits = {
    3: ['Push', 'Pull', 'Legs'],
    4: ['Upper', 'Lower', 'Upper 2', 'Lower 2'],
    5: ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms'],
    6: ['Push 1', 'Pull 1', 'Legs 1', 'Push 2', 'Pull 2', 'Legs 2']
  };
  const [trainingDays, setTrainingDays] = useState(3);
  const [currentSplit, setCurrentSplit] = useState(null);

  const googleLinked = isGoogleUser();
  const passwordLinked = hasPasswordProvider();

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setNewEmail(currentUser.email || '');
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          setBackupEmail(data.backupEmail || '');
          setCurrentSplit(data.activeSplit || null);
          if (data.activeSplit) {
            setTrainingDays(data.activeSplit.length > 6 ? 6 : (data.activeSplit.length < 3 ? 3 : data.activeSplit.length));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [currentUser, getUserData]);

  const handleSaveSplit = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { activeSplit: availableSplits[trainingDays] });
      setCurrentSplit(availableSplits[trainingDays]);
      showMessage('Workout split saved successfully!');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSaveEmail = async () => {
    if (newEmail === currentUser.email) return showMessage('That is already your current email.', 'error');
    setSaving(true);
    try {
      // Check if the email is already in use
      const methods = await fetchSignInMethodsForEmail(auth, newEmail);
      if (methods.length > 0) {
        showMessage('This email is already in use by another account.', 'error');
        setSaving(false);
        return;
      }
      await updateUserEmail(newEmail);
      showMessage('Verification link sent to your new email!');
      setActiveSection(null);
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveBackupEmail = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, { backupEmail });
      showMessage('Backup email saved!');
      setActiveSection(null);
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) return showMessage('Passwords do not match', 'error');
    if (newPassword.length < 6) return showMessage('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      await updateUserPassword(newPassword);
      showMessage('Password updated!');
      setNewPassword(''); setConfirmPassword('');
      setActiveSection(null);
    } catch (err) { showMessage(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleLinkGoogle = async () => {
    setSaving(true);
    try {
      await linkGoogleAccount();
      setShowGoogleWarning(false);
      showMessage('Google account linked successfully!');
    } catch (err) {
      showMessage(err.code === 'auth/credential-already-in-use' ? 'This Google account is already linked to another user.' : err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteAccount();
    } catch (err) {
      showMessage(err.code === 'auth/requires-recent-login' ? 'Please sign out and sign back in first.' : err.message, 'error');
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 pb-24 min-h-full bg-slate-50">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-medium text-center shadow-lg ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>{message.text}</div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 pt-6 mb-6">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold text-liftly-navy">Account Settings</h1>
      </div>

      {/* Provider badges */}
      <div className="flex gap-2 mb-6">
        {googleLinked && (
          <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google Connected
          </span>
        )}
        {passwordLinked && (
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Email/Password</span>
        )}
      </div>

      {/* ─── Workout Split ─── */}
      <AccordionItem 
        title="Workout Split" 
        subtitle={currentSplit ? `${currentSplit.length} Days/Week` : "Not configured"} 
        icon={<Dumbbell size={20} />} 
        iconBg="bg-orange-50 text-orange-500" 
        isOpen={activeSection === 'split'} 
        onToggle={() => setActiveSection(activeSection === 'split' ? null : 'split')}
      >
        <p className="text-slate-500 text-xs mb-3">How many days a week do you want to train?</p>
        <div className="flex gap-2 mb-4">
          {[3, 4, 5, 6].map(days => (
            <button 
              key={days}
              onClick={() => setTrainingDays(days)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${trainingDays === days ? 'bg-liftly-navy text-white border-liftly-navy' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
            >
              {days} Days
            </button>
          ))}
        </div>
        
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Suggested Split:</p>
          <div className="flex flex-wrap gap-2">
            {availableSplits[trainingDays].map((day, idx) => (
              <span key={idx} className="bg-white border border-slate-200 text-liftly-navy text-xs px-2 py-1 rounded-md font-semibold">{day}</span>
            ))}
          </div>
        </div>

        <button onClick={handleSaveSplit} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save Split</span></>}
        </button>
      </AccordionItem>

      {/* ─── Email ─── */}
      {googleLinked && !passwordLinked ? (
        <AccordionItem title="Backup Email" subtitle="Add a recovery email" icon={<Mail size={20} />} iconBg="bg-green-50 text-green-500" isOpen={activeSection === 'email'} onToggle={() => setActiveSection(activeSection === 'email' ? null : 'email')}>
          <p className="text-slate-400 text-xs mb-2">Your Google email ({currentUser?.email}) cannot be changed. Add a backup for recovery.</p>
          <input type="email" placeholder="Backup email address" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={backupEmail} onChange={(e) => setBackupEmail(e.target.value)} />
          <button onClick={handleSaveBackupEmail} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save</span></>}
          </button>
        </AccordionItem>
      ) : (
        <AccordionItem title="Email Address" subtitle={currentUser?.email} icon={<Mail size={20} />} iconBg="bg-green-50 text-green-500" isOpen={activeSection === 'email'} onToggle={() => setActiveSection(activeSection === 'email' ? null : 'email')}>
          <input type="email" placeholder="New email address" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button onClick={handleSaveEmail} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Email</span></>}
          </button>
        </AccordionItem>
      )}

      {/* ─── Password ─── */}
      {passwordLinked && (
        <AccordionItem title="Change Password" subtitle="Update your password" icon={<Lock size={20} />} iconBg="bg-purple-50 text-purple-500" isOpen={activeSection === 'password'} onToggle={() => setActiveSection(activeSection === 'password' ? null : 'password')}>
          <input type="password" placeholder="New password" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" placeholder="Confirm new password" className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button onClick={handleSavePassword} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Password</span></>}
          </button>
        </AccordionItem>
      )}

      {/* ─── Link Google ─── */}
      {passwordLinked && !googleLinked && (
        <>
          <AccordionItem
            title="Connect Google Account"
            subtitle="Link your Google for easy sign-in"
            icon={<Link2 size={20} />}
            iconBg="bg-blue-50 text-blue-500"
            isOpen={showGoogleWarning}
            onToggle={() => setShowGoogleWarning(!showGoogleWarning)}
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-1">
              <div className="flex items-start gap-2">
                <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700 text-sm mb-1">Important: Read before linking</p>
                  <ul className="text-amber-600 text-xs space-y-1.5">
                    <li>• After linking, you will <strong>only be able to sign in with Google</strong></li>
                    <li>• Your email/password login will no longer work</li>
                    <li>• Your workouts and data will remain unchanged</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            <button onClick={handleLinkGoogle} disabled={saving} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/></svg>
                  <span>Yes, Link Google Account</span>
                </>
              )}
            </button>
            <button onClick={() => setShowGoogleWarning(false)} className="w-full h-11 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95">
              Cancel
            </button>
          </AccordionItem>
        </>
      )}

      {/* ─── Delete Account ─── */}
      <div className="mt-6">
        <AccordionItem
          title="Delete Account"
          subtitle="Permanently remove your account"
          icon={<Trash2 size={20} />}
          iconBg="bg-red-50 text-red-500"
          isOpen={showDeleteConfirm}
          onToggle={() => setShowDeleteConfirm(!showDeleteConfirm)}
        >
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-1">
            <div className="flex items-start gap-2">
              <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-600 text-sm mb-1">This action is permanent</p>
                <p className="text-red-500 text-xs">Your account, workouts, and all data will be permanently deleted. This cannot be undone.</p>
              </div>
            </div>
          </div>
          <button onClick={handleDeleteAccount} disabled={saving} className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete My Account'}
          </button>
          <button onClick={() => setShowDeleteConfirm(false)} className="w-full h-11 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl flex items-center justify-center transition-all active:scale-95">
            Cancel
          </button>
        </AccordionItem>
      </div>

      {/* ─── Logout ─── */}
      <div className="mt-4">
        <button onClick={handleLogout} className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-red-100">
          <LogOut size={18} /><span>Sign Out</span>
        </button>
      </div>

      <p className="text-center text-slate-300 text-xs mt-6">Liftly v1.0</p>
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

export default AccountSettings;
