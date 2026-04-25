import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, UserCircle, Settings, LogOut, Scale, Calculator, Utensils, Activity, ChevronRight, Zap, Trophy } from 'lucide-react';
import clsx from 'clsx';

const SideDrawer = ({ isOpen, onClose }) => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;
  const memberSince = userData?.createdAt?.toDate?.()?.getFullYear?.() || new Date().getFullYear();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-[82%] max-w-[320px] z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002070 100%)' }}
      >
        {/* Decorative orb */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-liftly-teal/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-6 pt-12 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {photoURL ? (
                <div className="relative">
                  <img src={photoURL} alt="Profile" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-liftly-teal/40" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-liftly-navy" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-liftly-teal/20 border border-liftly-teal/30 flex items-center justify-center text-white font-black text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">{displayName}</h2>
                <span className="text-[10px] text-liftly-teal font-bold uppercase tracking-widest">Liftly Member</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/10 text-white/60 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-black text-lg">{userData?.currentStreak || 0}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Streak</p>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-black text-lg">{memberSince}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Joined</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 no-scrollbar">

          {/* Community Section */}
          <div>
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 px-1">Community</h3>
            <div className="space-y-1.5 mb-6">
              <DrawerLink to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" color="bg-yellow-500/20 text-yellow-400" onClick={onClose} />
            </div>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 px-1">Body & Tools</h3>
            <div className="space-y-1.5">
              <DrawerLink to="/tools/weight" icon={<Scale size={18} />} label="Weight Tracker" color="bg-blue-500/20 text-blue-400" onClick={onClose} />
              <DrawerLink to="/tools/bmi" icon={<Activity size={18} />} label="BMI Calculator" color="bg-emerald-500/20 text-emerald-400" onClick={onClose} />
              <DrawerLink to="/tools/calories" icon={<Utensils size={18} />} label="Caloric Goals" color="bg-orange-500/20 text-orange-400" onClick={onClose} />
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 px-1">Account</h3>
            <div className="space-y-1.5">
              <DrawerLink to="/personal-info" icon={<UserCircle size={18} />} label="Personal Information" color="bg-indigo-500/20 text-indigo-400" onClick={onClose} />
              <DrawerLink to="/settings" icon={<Settings size={18} />} label="Account Settings" color="bg-slate-500/20 text-slate-400" onClick={onClose} />
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="p-6 relative z-10 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-12 flex items-center justify-center gap-2 text-red-400 font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-all active:scale-95"
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

const DrawerLink = ({ to, icon, label, color, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => clsx(
      'flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95',
      isActive ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'
    )}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <span className="font-semibold text-sm text-white/80">{label}</span>
    <ChevronRight size={14} className="ml-auto text-white/20" />
  </NavLink>
);

export default SideDrawer;
