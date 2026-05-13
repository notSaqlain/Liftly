import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LogOut, Save, Loader2, Mail, Lock, ChevronLeft, ChevronRight, Link2, Trash2, ShieldAlert, AlertTriangle, Settings, Ghost } from 'lucide-react';

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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);

  const googleLinked = isGoogleUser();
  const passwordLinked = hasPasswordProvider();

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setNewEmail(currentUser.email || '');
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          if (data.hideOnlineStatus !== undefined) {
            setHideOnlineStatus(data.hideOnlineStatus);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [currentUser, getUserData]);

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { hideOnlineStatus });
      showMessage('Privacy settings updated!');
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
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      showMessage(err.code === 'auth/requires-recent-login' ? 'Please sign out and sign back in first.' : err.message, 'error');
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-[#040810] min-h-full flex flex-col animate-fade-in">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-bold text-center shadow-lg animate-slide-up ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>{message.text}</div>
      )}

      {/* Header */}
      <div className="bg-liftly-navy px-5 pt-12 pb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-liftly-teal/10 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all backdrop-blur-sm shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings size={14} className="text-slate-400" />
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Preferences</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">Account Settings</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Provider badges */}
        <div className="flex gap-2">
          {googleLinked && (
            <span className="px-3 py-1.5 bg-blue-500/15 text-blue-400 text-[10px] font-black rounded-xl uppercase tracking-wider flex items-center gap-1.5 border border-blue-500/20">
              <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google Connected
            </span>
          )}
          {passwordLinked && (
            <span className="px-3 py-1.5 bg-white/10 text-white/50 text-[10px] font-black rounded-xl uppercase tracking-wider border border-white/10">Email/Password</span>
          )}
        </div>

        {/* ─── Privacy Settings ─── */}
        <AccordionItem 
          title="Privacy" 
          subtitle={hideOnlineStatus ? "Incognito Mode Active" : "Visible Online"} 
          icon={<Ghost size={18} />} 
          iconBg={hideOnlineStatus ? "bg-liftly-teal/20 text-liftly-teal" : "bg-white/10 text-white/50"} 
          isOpen={activeSection === 'privacy'} 
          onToggle={() => setActiveSection(activeSection === 'privacy' ? null : 'privacy')}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-white text-sm">Incognito Mode</span>
              <button 
                onClick={() => setHideOnlineStatus(!hideOnlineStatus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hideOnlineStatus ? 'bg-liftly-teal' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideOnlineStatus ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-white/50 text-xs font-semibold leading-relaxed">
              When enabled, your online status will be hidden from other users in LiftChat. However, you will also not be able to see who else is online.
            </p>
          </div>
          <button onClick={handleSavePrivacy} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save Privacy Settings</span></>}
          </button>
        </AccordionItem>



        {/* ─── Email ─── */}
        {googleLinked && !passwordLinked ? (
          <div className="bg-[#0D1526] rounded-2xl p-4 border border-white/5 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500">
                <Mail size={18} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-black text-white text-sm">Email Address</p>
                <p className="text-white/40 text-xs font-medium truncate">{currentUser?.email}</p>
              </div>
              <span className="px-2 py-1 bg-blue-500/15 text-blue-400 text-[9px] font-black rounded-lg uppercase tracking-wider border border-blue-500/20 shrink-0">Google</span>
            </div>
            <p className="text-white/30 text-[11px] font-medium mt-3 leading-relaxed pl-1">
              Your email is managed by Google and cannot be changed here.
            </p>
          </div>
        ) : (
          <AccordionItem title="Email Address" subtitle={currentUser?.email} icon={<Mail size={18} />} iconBg="bg-emerald-50 text-emerald-500" isOpen={activeSection === 'email'} onToggle={() => setActiveSection(activeSection === 'email' ? null : 'email')}>
            <input type="email" placeholder="New email address" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-semibold focus:outline-none focus:border-liftly-teal/50 focus:ring-1 focus:ring-liftly-teal/20 mb-4 transition-all" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button onClick={handleSaveEmail} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Email</span></>}
            </button>
          </AccordionItem>
        )}

        {/* ─── Password ─── */}
        {passwordLinked && (
          <AccordionItem title="Change Password" subtitle="Update your password" icon={<Lock size={18} />} iconBg="bg-purple-50 text-purple-500" isOpen={activeSection === 'password'} onToggle={() => setActiveSection(activeSection === 'password' ? null : 'password')}>
            <div className="space-y-3 mb-4">
              <input type="password" placeholder="New password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-semibold focus:outline-none focus:border-liftly-teal/50 focus:ring-1 focus:ring-liftly-teal/20 transition-all" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <input type="password" placeholder="Confirm new password" className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-semibold focus:outline-none focus:border-liftly-teal/50 focus:ring-1 focus:ring-liftly-teal/20 transition-all" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button onClick={handleSavePassword} disabled={saving} className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-black text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Password</span></>}
            </button>
          </AccordionItem>
        )}

        {/* ─── Link Google ─── */}
        {passwordLinked && !googleLinked && (
          <AccordionItem
            title="Connect Google Account"
            subtitle="Link your Google for easy sign-in"
            icon={<Link2 size={18} />}
            iconBg="bg-blue-50 text-blue-500"
            isOpen={showGoogleWarning}
            onToggle={() => setShowGoogleWarning(!showGoogleWarning)}
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-700 text-sm mb-1.5">Important: Read before linking</p>
                  <ul className="text-amber-600/80 text-xs font-semibold space-y-1.5">
                    <li>• After linking, you will <strong className="text-amber-700">only be able to sign in with Google</strong></li>
                    <li>• Your email/password login will no longer work</li>
                    <li>• Your workouts and data will remain unchanged</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            <button onClick={handleLinkGoogle} disabled={saving} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 mb-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/></svg>
                  <span>Yes, Link Google Account</span>
                </>
              )}
            </button>
            <button onClick={() => setShowGoogleWarning(false)} className="w-full h-11 bg-white/10 text-white/60 hover:bg-white/15 font-black text-sm rounded-xl flex items-center justify-center transition-all active:scale-95">
              Cancel
            </button>
          </AccordionItem>
        )}

        {/* ─── Delete Account ─── */}
        <div className="pt-2">
          <button
            onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); }}
            className="w-full h-14 bg-red-500/8 hover:bg-red-500/15 text-red-400 font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-95 border border-red-500/20"
          >
            <Trash2 size={17} />
            <span>Delete Account</span>
          </button>
        </div>

        {/* ─── Logout ─── */}
        <div className="pt-4">
          <button onClick={handleLogout} className="w-full h-14 bg-white/5 hover:bg-red-500/10 text-red-400 font-black rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-red-500/20">
            <LogOut size={18} /><span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* ─── Delete Account Modal ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-[480px] bg-[#0D1526] rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-white/10">
            {deleting ? (
              /* Loading state */
              <div className="flex flex-col items-center py-8 gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Trash2 size={28} className="text-red-400" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-red-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-lg">Deleting account…</p>
                  <p className="text-white/40 text-sm font-medium mt-1">Permanently erasing all your data</p>
                </div>
              </div>
            ) : (
              /* Confirm state */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-base leading-tight">Delete your account?</p>
                    <p className="text-white/40 text-xs font-medium mt-0.5">This action cannot be undone</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5">
                  <ul className="space-y-1.5">
                    {['All your workouts and stats', 'Your profile and personal data', 'Your points and achievements', 'Your gym membership link'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-red-300 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {item} will be <strong className="text-red-200">permanently deleted</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-white/50 text-xs font-bold mb-2 uppercase tracking-widest">Type <span className="text-red-400">DELETE</span> to confirm</p>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white font-bold tracking-widest focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 mb-4 transition-all placeholder:text-white/20 placeholder:font-normal placeholder:tracking-normal"
                />

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="w-full h-13 bg-red-500 hover:bg-red-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mb-3"
                >
                  <Trash2 size={16} /> Yes, permanently delete my account
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  className="w-full h-12 bg-white/8 text-white/60 hover:bg-white/12 font-black text-sm rounded-xl flex items-center justify-center transition-all active:scale-95"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AccordionItem = ({ title, subtitle, icon, iconBg, isOpen, onToggle, children }) => (
  <div className="mb-3">
    <button onClick={onToggle} className={`w-full bg-[#0D1526] rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all ${isOpen ? 'rounded-b-none border-b-0' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="text-left">
          <p className="font-black text-white text-sm">{title}</p>
          <p className="text-white/40 text-xs font-medium truncate max-w-[200px]">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={18} className={`text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
    </button>
    {isOpen && (
      <div className="bg-[#0D1526] rounded-b-2xl p-4 pt-2 border border-t-0 border-white/5 animate-fade-in">
        <div className="pt-3 border-t border-white/5">
          {children}
        </div>
      </div>
    )}
  </div>
);

export default AccountSettings;
