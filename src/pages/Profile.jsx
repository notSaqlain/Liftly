import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Save, Loader2, User, Mail, Lock, Weight, Calendar, ChevronRight } from 'lucide-react';

const Profile = () => {
  const { currentUser, logout, getUserData, updateUserProfile, updateUserEmail, updateUserPassword, updateDisplayName } = useAuth();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState(null); // 'personal', 'email', 'password'

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('Other');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        firstName,
        lastName,
        age: parseInt(age, 10),
        weight: parseFloat(weight),
        gender,
      });
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
      showMessage('Email updated successfully!');
      setActiveSection(null);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      return showMessage('Passwords do not match', 'error');
    }
    if (newPassword.length < 6) {
      return showMessage('Password must be at least 6 characters', 'error');
    }
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
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

  const displayName = firstName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="p-6 pb-24 min-h-full bg-slate-50">
      {/* Status Message Toast */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[420px] w-[90%] px-4 py-3 rounded-2xl text-sm font-medium text-center shadow-lg transition-all animate-[slideDown_0.3s_ease-out] ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-liftly-navy flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-extrabold text-liftly-navy capitalize">{displayName}</h1>
        <p className="text-slate-400 text-sm mt-1">{currentUser?.email}</p>
      </div>

      {/* ─── Personal Info ─── */}
      <div className="mb-4">
        <button
          onClick={() => setActiveSection(activeSection === 'personal' ? null : 'personal')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-blue-50 text-blue-500 p-2.5 rounded-xl"><User size={20} /></span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Personal Information</p>
              <p className="text-slate-400 text-xs">Name, age, weight, gender</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-300 transition-transform duration-200 ${activeSection === 'personal' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'personal' && (
          <div className="bg-white rounded-2xl p-5 mt-2 shadow-sm border border-slate-100 space-y-3 animate-[slideDown_0.2s_ease-out]">
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="First Name"
                className="w-1/2 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-1/2 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <div className="relative w-1/2">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  placeholder="Age"
                  min="12" max="120"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="relative w-1/2">
                <Weight size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  step="0.1" min="20" max="300"
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <select
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors appearance-none"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <button
              onClick={handleSavePersonal}
              disabled={saving}
              className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Save Changes</span></>}
            </button>
          </div>
        )}
      </div>

      {/* ─── Email ─── */}
      <div className="mb-4">
        <button
          onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-green-50 text-green-500 p-2.5 rounded-xl"><Mail size={20} /></span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Email Address</p>
              <p className="text-slate-400 text-xs">{currentUser?.email}</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-300 transition-transform duration-200 ${activeSection === 'email' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'email' && (
          <div className="bg-white rounded-2xl p-5 mt-2 shadow-sm border border-slate-100 space-y-3 animate-[slideDown_0.2s_ease-out]">
            <input
              type="email"
              placeholder="New email address"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button
              onClick={handleSaveEmail}
              disabled={saving}
              className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Email</span></>}
            </button>
          </div>
        )}
      </div>

      {/* ─── Password ─── */}
      <div className="mb-4">
        <button
          onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-purple-50 text-purple-500 p-2.5 rounded-xl"><Lock size={20} /></span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm">Change Password</p>
              <p className="text-slate-400 text-xs">Update your password</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-300 transition-transform duration-200 ${activeSection === 'password' ? 'rotate-90' : ''}`} />
        </button>

        {activeSection === 'password' && (
          <div className="bg-white rounded-2xl p-5 mt-2 shadow-sm border border-slate-100 space-y-3 animate-[slideDown_0.2s_ease-out]">
            <input
              type="password"
              placeholder="New password"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 focus:outline-none focus:border-liftly-teal focus:ring-1 focus:ring-liftly-teal transition-colors"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              onClick={handleSavePassword}
              disabled={saving}
              className="w-full h-12 bg-liftly-teal hover:bg-teal-400 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16} /><span>Update Password</span></>}
            </button>
          </div>
        )}
      </div>

      {/* ─── Logout ─── */}
      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="w-full h-14 bg-red-50 hover:bg-red-100 text-red-500 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 border border-red-100"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      <p className="text-center text-slate-300 text-xs mt-6">Liftly v1.0</p>
    </div>
  );
};

export default Profile;
