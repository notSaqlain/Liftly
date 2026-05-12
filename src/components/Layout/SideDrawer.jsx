import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  X, UserCircle, Settings, LogOut, Scale, Utensils, Activity,
  ChevronRight, Trophy, Building2, Dumbbell, MessageSquareDot,
  ShieldCheck, Swords, Users
} from 'lucide-react';
import clsx from 'clsx';

const SideDrawer = ({ isOpen, onClose }) => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;
  const memberSince = userData?.createdAt?.toDate?.()?.getFullYear?.() || new Date().getFullYear();
  const gymName = userData?.gymName || null;

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
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'rgba(4,8,16,0.8)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-[82%] max-w-[320px] z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-hidden',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ background: '#0A0F1E', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(0,229,209,0.08)' }} />
        <div className="absolute bottom-20 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(124,110,245,0.08)' }} />

        {/* Header */}
        <div className="relative z-10 p-6 pt-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {photoURL ? (
                <div className="relative">
                  <img src={photoURL} alt="Profile" className="w-14 h-14 rounded-2xl object-cover" style={{ border: '2px solid rgba(0,229,209,0.3)' }} referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2" style={{ borderColor: '#0A0F1E' }} />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-brand font-black text-xl" style={{ background: 'rgba(0,229,209,0.1)', border: '1px solid rgba(0,229,209,0.2)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">{displayName}</h2>
                <span className="text-[10px] text-brand font-black uppercase tracking-widest">Liftly Member</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white font-black text-lg">{userData?.points || 0}</p>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Points</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white font-black text-lg">{memberSince}</p>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider">Joined</p>
            </div>
            {gymName && (
              <div className="flex-1 rounded-xl p-3 text-center overflow-hidden" style={{ background: 'rgba(0,229,209,0.08)', border: '1px solid rgba(0,229,209,0.15)' }}>
                <p className="text-brand font-black text-[10px] truncate">{gymName}</p>
                <p className="text-brand/60 text-[9px] font-bold uppercase tracking-wider">My Gym</p>
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 relative z-10 no-scrollbar">

          {/* My Gym Section */}
          {userData?.gymId && (
            <div>
              <SectionLabel label="My Gym" />
              <div className="space-y-1">
                <DrawerLink to="/gym/equipment"   icon={<Dumbbell size={16} />}          label="Equipment Status"    color="bg-cyan-500/15 text-cyan-400"    onClick={onClose} />
                <DrawerLink to="/gym/trainers"    icon={<Users size={16} />}             label="Personal Trainers"   color="bg-purple-500/15 text-purple-400" onClick={onClose} />
                <DrawerLink to="/gym/challenges"  icon={<Swords size={16} />}            label="Challenges"          color="bg-orange-500/15 text-orange-400" onClick={onClose} />
                <DrawerLink to="/gym/support"     icon={<MessageSquareDot size={16} />}  label="Gym Support"         color="bg-pink-500/15 text-pink-400"     onClick={onClose} />
              </div>
            </div>
          )}

          {/* Community */}
          <div>
            <SectionLabel label="Community" />
            <div className="space-y-1">
              <DrawerLink to="/friends"      icon={<Users size={16} />}          label="Friends List"     color="bg-pink-500/15 text-pink-400" onClick={onClose} />
              <DrawerLink to="/leaderboard"  icon={<Trophy size={16} />}         label="Leaderboard"      color="bg-yellow-500/15 text-yellow-400" onClick={onClose} />
              <DrawerLink to="/chat"         icon={<MessageSquareDot size={16} />} label="Chat Hub" color="bg-brand/15 text-brand"          onClick={onClose} />
            </div>
          </div>

          {/* Body & Tools */}
          <div>
            <SectionLabel label="Body & Tools" />
            <div className="space-y-1">
              <DrawerLink to="/tools/weight"    icon={<Scale size={16} />}      label="Weight Tracker"   color="bg-blue-500/15 text-blue-400"    onClick={onClose} />
              <DrawerLink to="/tools/bmi"       icon={<Activity size={16} />}   label="BMI Calculator"   color="bg-emerald-500/15 text-emerald-400" onClick={onClose} />
              <DrawerLink to="/tools/calories"  icon={<Utensils size={16} />}   label="Caloric Goals"    color="bg-orange-500/15 text-orange-400" onClick={onClose} />
            </div>
          </div>

          {/* Account */}
          <div>
            <SectionLabel label="Account" />
            <div className="space-y-1">
              <DrawerLink to="/my-plan"        icon={<ShieldCheck size={16} />}  label="My Plan"              color="bg-brand/15 text-brand"          onClick={onClose} />
              <DrawerLink to="/personal-info"  icon={<UserCircle size={16} />}   label="Personal Information" color="bg-indigo-500/15 text-indigo-400" onClick={onClose} />
              <DrawerLink to="/settings"       icon={<Settings size={16} />}     label="Account Settings"     color="bg-slate-500/15 text-slate-400"   onClick={onClose} />
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="p-5 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-12 flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'Signing out…' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

const SectionLabel = ({ label }) => (
  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2 px-1">{label}</p>
);

const DrawerLink = ({ to, icon, label, color, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => clsx(
      'flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95',
      isActive
        ? 'bg-white/08 border border-white/08'
        : 'hover:bg-white/04 border border-transparent'
    )}
    style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)' } : {}}
  >
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <span className="font-semibold text-sm text-white/70">{label}</span>
    <ChevronRight size={14} className="ml-auto text-white/15" />
  </NavLink>
);

export default SideDrawer;
